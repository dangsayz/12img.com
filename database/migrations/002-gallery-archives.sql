-- ============================================
-- Migration: 002-gallery-archives
-- ZIP Archive System for Galleries
-- ============================================

-- Create enum for archive status
CREATE TYPE archive_status AS ENUM (
    'pending',      -- Job queued but not started
    'processing',   -- Currently generating ZIP
    'completed',    -- ZIP ready and verified
    'failed'        -- Generation failed
);

-- --------------------------------------------
-- gallery_archives
-- Tracks ZIP archives per gallery with versioning
-- --------------------------------------------
CREATE TABLE public.gallery_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    
    -- Version tracking for idempotency
    version INTEGER NOT NULL DEFAULT 1,
    images_hash TEXT NOT NULL,  -- SHA256 hash of sorted image IDs - for idempotency check
    
    -- Archive metadata
    storage_path TEXT NOT NULL,  -- Path in storage: galleries/{id}/archives/{version}.zip
    file_size_bytes BIGINT,      -- Size of final ZIP (NULL until completed)
    checksum TEXT,               -- SHA256 of ZIP file for integrity verification
    image_count INTEGER NOT NULL DEFAULT 0,
    
    -- Status tracking
    status archive_status NOT NULL DEFAULT 'pending',
    error_message TEXT,           -- Error details if failed
    
    -- Email notification tracking
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    email_recipient TEXT,         -- Email address ZIP link was sent to
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,     -- When ZIP generation finished
    expires_at TIMESTAMPTZ,       -- Optional: When archive should be cleaned up
    
    -- Constraints
    CONSTRAINT gallery_archives_version_positive CHECK (version > 0),
    CONSTRAINT gallery_archives_storage_path_format CHECK (
        storage_path ~ '^galleries/[a-f0-9-]+/archives/[0-9]+\.zip$'
    )
);

-- Indexes for common queries
CREATE INDEX idx_gallery_archives_gallery_id ON public.gallery_archives(gallery_id);
CREATE INDEX idx_gallery_archives_status ON public.gallery_archives(status);
CREATE INDEX idx_gallery_archives_images_hash ON public.gallery_archives(gallery_id, images_hash);
CREATE INDEX idx_gallery_archives_created_at ON public.gallery_archives(created_at DESC);

-- Unique constraint: only one active archive per gallery+hash combo
CREATE UNIQUE INDEX idx_gallery_archives_unique_active ON public.gallery_archives(gallery_id, images_hash)
    WHERE status = 'completed';

-- Index for finding latest completed archive per gallery
CREATE INDEX idx_gallery_archives_latest ON public.gallery_archives(gallery_id, version DESC)
    WHERE status = 'completed';

-- --------------------------------------------
-- gallery_clients
-- Client contact info for email notifications
-- --------------------------------------------
CREATE TABLE public.gallery_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    notify_on_archive BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT gallery_clients_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_gallery_clients_gallery_id ON public.gallery_clients(gallery_id);
CREATE UNIQUE INDEX idx_gallery_clients_unique_email ON public.gallery_clients(gallery_id, email);

-- --------------------------------------------
-- archive_jobs
-- Job queue table (if not using external queue)
-- Simple PostgreSQL-based job queue with retry support
-- --------------------------------------------
CREATE TABLE public.archive_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    archive_id UUID REFERENCES public.gallery_archives(id) ON DELETE CASCADE,
    
    -- Job state
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority INTEGER NOT NULL DEFAULT 0,
    
    -- Retry handling
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    
    -- Scheduling
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Worker tracking (for distributed processing)
    locked_by TEXT,
    locked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_archive_jobs_status ON public.archive_jobs(status, run_at) WHERE status = 'pending';
CREATE INDEX idx_archive_jobs_gallery ON public.archive_jobs(gallery_id);
CREATE INDEX idx_archive_jobs_locked ON public.archive_jobs(locked_by, locked_at) WHERE status = 'processing';

-- Trigger for updated_at
CREATE TRIGGER trigger_archive_jobs_updated_at
    BEFORE UPDATE ON public.archive_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to compute images hash for a gallery (for idempotency)
CREATE OR REPLACE FUNCTION compute_gallery_images_hash(p_gallery_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_hash TEXT;
BEGIN
    SELECT encode(sha256(string_agg(id::text, ',' ORDER BY id)::bytea), 'hex')
    INTO v_hash
    FROM public.images
    WHERE gallery_id = p_gallery_id;
    
    -- Return empty hash for galleries with no images
    RETURN COALESCE(v_hash, 'empty');
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get the latest valid archive for a gallery
CREATE OR REPLACE FUNCTION get_latest_gallery_archive(p_gallery_id UUID)
RETURNS TABLE (
    id UUID,
    storage_path TEXT,
    file_size_bytes BIGINT,
    image_count INTEGER,
    created_at TIMESTAMPTZ,
    is_current BOOLEAN
) AS $$
DECLARE
    v_current_hash TEXT;
BEGIN
    -- Get current images hash
    v_current_hash := compute_gallery_images_hash(p_gallery_id);
    
    RETURN QUERY
    SELECT 
        a.id,
        a.storage_path,
        a.file_size_bytes,
        a.image_count,
        a.created_at,
        (a.images_hash = v_current_hash) AS is_current
    FROM public.gallery_archives a
    WHERE a.gallery_id = p_gallery_id
      AND a.status = 'completed'
    ORDER BY a.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to acquire a job for processing (with advisory lock)
CREATE OR REPLACE FUNCTION acquire_archive_job(p_worker_id TEXT)
RETURNS TABLE (
    job_id UUID,
    gallery_id UUID,
    archive_id UUID
) AS $$
DECLARE
    v_job RECORD;
BEGIN
    -- Find and lock an available job
    SELECT * INTO v_job
    FROM public.archive_jobs j
    WHERE j.status = 'pending'
      AND j.run_at <= NOW()
      AND j.attempts < j.max_attempts
      AND (j.locked_by IS NULL OR j.locked_at < NOW() - INTERVAL '5 minutes')
    ORDER BY j.priority DESC, j.run_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF v_job.id IS NULL THEN
        RETURN;
    END IF;
    
    -- Mark job as processing
    UPDATE public.archive_jobs
    SET status = 'processing',
        locked_by = p_worker_id,
        locked_at = NOW(),
        started_at = NOW(),
        attempts = attempts + 1
    WHERE id = v_job.id;
    
    RETURN QUERY SELECT v_job.id, v_job.gallery_id, v_job.archive_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.gallery_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_jobs ENABLE ROW LEVEL SECURITY;

-- Archives: Gallery owners can read their archives
CREATE POLICY "gallery_archives_select_own"
    ON public.gallery_archives
    FOR SELECT
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Clients: Gallery owners can manage their clients
CREATE POLICY "gallery_clients_select_own"
    ON public.gallery_clients
    FOR SELECT
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "gallery_clients_insert_own"
    ON public.gallery_clients
    FOR INSERT
    WITH CHECK (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "gallery_clients_delete_own"
    ON public.gallery_clients
    FOR DELETE
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Jobs: Service role only (no direct user access)
-- No user-facing policies needed
