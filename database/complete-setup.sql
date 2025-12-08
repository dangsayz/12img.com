-- ============================================
-- 12img Complete Database Setup
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PART 2: TABLES
-- ============================================

-- Users table (extension of Clerk user)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- User settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    default_password_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    default_download_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Galleries table
CREATE TABLE IF NOT EXISTS public.galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    password_hash TEXT,
    download_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    cover_image_id UUID,
    -- Template and visibility
    template TEXT NOT NULL DEFAULT 'mosaic',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    lock_pin_hash TEXT,
    -- Presentation data (JSON)
    presentation_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT galleries_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
    CONSTRAINT galleries_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT galleries_slug_length CHECK (char_length(slug) >= 3 AND char_length(slug) <= 60)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_galleries_slug ON public.galleries(slug);
CREATE INDEX IF NOT EXISTS idx_galleries_user_id ON public.galleries(user_id);
CREATE INDEX IF NOT EXISTS idx_galleries_created_at ON public.galleries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_galleries_is_public ON public.galleries(is_public);

-- Images table
CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT images_storage_path_format CHECK (storage_path ~ '^[a-zA-Z0-9/_-]+\.[a-zA-Z]+$'),
    CONSTRAINT images_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400),
    CONSTRAINT images_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_images_storage_path ON public.images(storage_path);
CREATE INDEX IF NOT EXISTS idx_images_gallery_id ON public.images(gallery_id);
CREATE INDEX IF NOT EXISTS idx_images_gallery_position ON public.images(gallery_id, position);

-- Add foreign key for cover_image_id
ALTER TABLE public.galleries
    DROP CONSTRAINT IF EXISTS fk_galleries_cover_image;
    
ALTER TABLE public.galleries
    ADD CONSTRAINT fk_galleries_cover_image
    FOREIGN KEY (cover_image_id) REFERENCES public.images(id) ON DELETE SET NULL;

-- ============================================
-- PART 3: FUNCTIONS
-- ============================================

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Insert image with proper position handling
CREATE OR REPLACE FUNCTION public.insert_image_at_position(
    p_gallery_id UUID,
    p_storage_path TEXT,
    p_original_filename TEXT,
    p_file_size_bytes BIGINT,
    p_mime_type TEXT,
    p_width INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_next_position INTEGER;
    v_image_id UUID;
BEGIN
    -- Lock the gallery row to prevent concurrent position calculation
    PERFORM id FROM public.galleries WHERE id = p_gallery_id FOR UPDATE;
    
    -- Get next position atomically
    SELECT COALESCE(MAX(position), -1) + 1 INTO v_next_position
    FROM public.images
    WHERE gallery_id = p_gallery_id;
    
    -- Insert with calculated position
    INSERT INTO public.images (
        gallery_id,
        storage_path,
        original_filename,
        file_size_bytes,
        mime_type,
        width,
        height,
        position
    ) VALUES (
        p_gallery_id,
        p_storage_path,
        p_original_filename,
        p_file_size_bytes,
        p_mime_type,
        p_width,
        p_height,
        v_next_position
    )
    RETURNING id INTO v_image_id;
    
    RETURN v_image_id;
END;
$$ LANGUAGE plpgsql;

-- Get user ID from Clerk ID
CREATE OR REPLACE FUNCTION public.get_user_id_from_clerk(p_clerk_id TEXT)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM public.users
    WHERE clerk_id = p_clerk_id;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PART 4: TRIGGERS
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON public.user_settings;
DROP TRIGGER IF EXISTS trigger_galleries_updated_at ON public.galleries;

-- Create triggers
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_galleries_updated_at
    BEFORE UPDATE ON public.galleries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PART 5: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_service" ON public.users;
DROP POLICY IF EXISTS "users_delete_service" ON public.users;

DROP POLICY IF EXISTS "user_settings_select_own" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update_own" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert_own" ON public.user_settings;

DROP POLICY IF EXISTS "galleries_select_own" ON public.galleries;
DROP POLICY IF EXISTS "galleries_select_public" ON public.galleries;
DROP POLICY IF EXISTS "galleries_insert_own" ON public.galleries;
DROP POLICY IF EXISTS "galleries_update_own" ON public.galleries;
DROP POLICY IF EXISTS "galleries_delete_own" ON public.galleries;

DROP POLICY IF EXISTS "images_select_own" ON public.images;
DROP POLICY IF EXISTS "images_select_public" ON public.images;
DROP POLICY IF EXISTS "images_insert_own" ON public.images;
DROP POLICY IF EXISTS "images_update_own" ON public.images;
DROP POLICY IF EXISTS "images_delete_own" ON public.images;

-- USERS POLICIES
CREATE POLICY "users_select_own"
    ON public.users
    FOR SELECT
    USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "users_update_own"
    ON public.users
    FOR UPDATE
    USING (clerk_id = auth.jwt() ->> 'sub')
    WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "users_insert_service"
    ON public.users
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "users_delete_service"
    ON public.users
    FOR DELETE
    USING (true);

-- USER_SETTINGS POLICIES
CREATE POLICY "user_settings_select_own"
    ON public.user_settings
    FOR SELECT
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "user_settings_update_own"
    ON public.user_settings
    FOR UPDATE
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    )
    WITH CHECK (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "user_settings_insert_own"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- GALLERIES POLICIES
CREATE POLICY "galleries_select_own"
    ON public.galleries
    FOR SELECT
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "galleries_select_public"
    ON public.galleries
    FOR SELECT
    USING (true);

CREATE POLICY "galleries_insert_own"
    ON public.galleries
    FOR INSERT
    WITH CHECK (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "galleries_update_own"
    ON public.galleries
    FOR UPDATE
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    )
    WITH CHECK (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "galleries_delete_own"
    ON public.galleries
    FOR DELETE
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- IMAGES POLICIES
CREATE POLICY "images_select_own"
    ON public.images
    FOR SELECT
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "images_select_public"
    ON public.images
    FOR SELECT
    USING (true);

CREATE POLICY "images_insert_own"
    ON public.images
    FOR INSERT
    WITH CHECK (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "images_update_own"
    ON public.images
    FOR UPDATE
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    )
    WITH CHECK (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "images_delete_own"
    ON public.images
    FOR DELETE
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- ============================================
-- PART 6: STORAGE BUCKET
-- ============================================

-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gallery-images',
    'gallery-images',
    false,
    26214400,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 26214400,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- PART 7: STORAGE POLICIES
-- ============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_own" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;

-- Gallery owners can upload to their gallery folder
CREATE POLICY "storage_insert_own"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'gallery-images'
        AND (storage.foldername(name))[1] IN (
            SELECT g.id::text FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Gallery owners can read their images
CREATE POLICY "storage_select_own"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'gallery-images'
        AND (storage.foldername(name))[1] IN (
            SELECT g.id::text FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Gallery owners can delete their images
CREATE POLICY "storage_delete_own"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'gallery-images'
        AND (storage.foldername(name))[1] IN (
            SELECT g.id::text FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Verify tables exist
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_settings', 'galleries', 'images');

-- Verify bucket exists
SELECT 'Storage bucket:' as status;
SELECT id, name, public FROM storage.buckets WHERE id = 'gallery-images';
