-- ============================================
-- Migration 042: Email Suppression List
-- ============================================
-- Prevents sending emails to addresses that have:
-- - Hard bounced
-- - Marked as spam (complained)
-- - Been manually suppressed
-- 
-- This is a critical guardrail for email deliverability
-- and sender reputation.
-- ============================================

-- --------------------------------------------
-- email_suppression_list
-- Tracks emails that should not receive messages
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_suppression_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Which user's sending is affected
    -- NULL means global suppression (affects all users)
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- The suppressed email address (lowercase)
    email TEXT NOT NULL,
    
    -- Why it was suppressed
    reason TEXT NOT NULL CHECK (reason IN ('hard_bounce', 'spam_complaint', 'manual', 'unsubscribe')),
    
    -- Additional details (bounce message, etc.)
    details TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = permanent, set for soft bounces
    
    -- Unique constraint per user+email
    CONSTRAINT email_suppression_unique UNIQUE (user_id, email)
);

-- Index for fast lookups when sending
CREATE INDEX idx_suppression_email ON public.email_suppression_list(email);
CREATE INDEX idx_suppression_user_email ON public.email_suppression_list(user_id, email);

-- --------------------------------------------
-- ROW LEVEL SECURITY
-- --------------------------------------------
ALTER TABLE public.email_suppression_list ENABLE ROW LEVEL SECURITY;

-- Users can see their own suppression list
CREATE POLICY "suppression_select_own"
    ON public.email_suppression_list
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.uid()::text
        )
    );

-- Users can insert to their own suppression list (manual unsubscribes)
CREATE POLICY "suppression_insert_own"
    ON public.email_suppression_list
    FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.uid()::text
        )
    );

-- Users can delete from their own suppression list
CREATE POLICY "suppression_delete_own"
    ON public.email_suppression_list
    FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.uid()::text
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if an email is suppressed for a user
CREATE OR REPLACE FUNCTION is_email_suppressed(
    p_user_id UUID,
    p_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.email_suppression_list
        WHERE (user_id = p_user_id OR user_id IS NULL)
        AND email = LOWER(p_email)
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get suppression reason for an email
CREATE OR REPLACE FUNCTION get_suppression_reason(
    p_user_id UUID,
    p_email TEXT
)
RETURNS TABLE (
    reason TEXT,
    details TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.reason,
        s.details,
        s.created_at
    FROM public.email_suppression_list s
    WHERE (s.user_id = p_user_id OR s.user_id IS NULL)
    AND s.email = LOWER(p_email)
    AND (s.expires_at IS NULL OR s.expires_at > NOW())
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Add email stats columns to users table
-- ============================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_bounce_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_complaint_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_email_bounce_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_sending_disabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sending_disabled_reason TEXT;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.email_suppression_list IS 'Tracks email addresses that should not receive messages due to bounces, complaints, or manual suppression';
COMMENT ON COLUMN public.email_suppression_list.reason IS 'hard_bounce = permanent delivery failure, spam_complaint = marked as spam, manual = user requested, unsubscribe = recipient unsubscribed';
