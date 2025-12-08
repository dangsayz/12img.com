-- ============================================
-- Migration 027: Client Profile Visibility System
-- Adds visibility modes (PRIVATE/PUBLIC/PUBLIC_LOCKED) to user profiles
-- and PIN-locking capability to individual galleries
-- ============================================

-- ============================================
-- PART 1: USER PROFILE VISIBILITY
-- ============================================

-- Add visibility_mode to users table (using users as the profile table)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS visibility_mode TEXT NOT NULL DEFAULT 'PRIVATE' 
  CHECK (visibility_mode IN ('PRIVATE', 'PUBLIC', 'PUBLIC_LOCKED'));

-- Add profile_slug for public URL routing
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS profile_slug TEXT UNIQUE;

-- Add profile PIN hash for PUBLIC_LOCKED mode
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS profile_pin_hash TEXT;

-- Add profile display fields
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create index for visibility mode queries
CREATE INDEX IF NOT EXISTS idx_users_visibility_mode ON public.users(visibility_mode);

-- Create index for profile slug lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_slug ON public.users(profile_slug);

-- ============================================
-- PART 2: GALLERY LOCKING
-- ============================================

-- Add is_locked flag to galleries
ALTER TABLE public.galleries
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- Add lock PIN hash for individual gallery locking
ALTER TABLE public.galleries
ADD COLUMN IF NOT EXISTS lock_pin_hash TEXT;

-- Create index for locked gallery queries
CREATE INDEX IF NOT EXISTS idx_galleries_is_locked ON public.galleries(is_locked);

-- ============================================
-- PART 3: GALLERY UNLOCK TOKENS TABLE
-- For tracking which galleries have been unlocked via PIN
-- ============================================

CREATE TABLE IF NOT EXISTS public.gallery_unlock_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    client_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 hours')
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_gallery_unlock_tokens_gallery_id ON public.gallery_unlock_tokens(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_unlock_tokens_expires_at ON public.gallery_unlock_tokens(expires_at);

-- ============================================
-- PART 4: HELPER FUNCTIONS
-- ============================================

-- Function to generate a unique profile slug from display name or email
CREATE OR REPLACE FUNCTION public.generate_profile_slug(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_base_slug TEXT;
    v_slug TEXT;
    v_counter INTEGER := 0;
    v_display_name TEXT;
    v_email TEXT;
BEGIN
    -- Get user's display name or email
    SELECT display_name, email INTO v_display_name, v_email
    FROM public.users
    WHERE id = p_user_id;
    
    -- Use display name if available, otherwise extract from email
    IF v_display_name IS NOT NULL AND v_display_name != '' THEN
        v_base_slug := lower(regexp_replace(v_display_name, '[^a-zA-Z0-9]+', '-', 'g'));
    ELSE
        v_base_slug := lower(split_part(v_email, '@', 1));
        v_base_slug := regexp_replace(v_base_slug, '[^a-zA-Z0-9]+', '-', 'g');
    END IF;
    
    -- Trim leading/trailing hyphens
    v_base_slug := trim(both '-' from v_base_slug);
    
    -- Ensure minimum length
    IF length(v_base_slug) < 3 THEN
        v_base_slug := v_base_slug || '-profile';
    END IF;
    
    -- Find unique slug
    v_slug := v_base_slug;
    WHILE EXISTS (SELECT 1 FROM public.users WHERE profile_slug = v_slug AND id != p_user_id) LOOP
        v_counter := v_counter + 1;
        v_slug := v_base_slug || '-' || v_counter;
    END LOOP;
    
    RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to get public profile by slug
CREATE OR REPLACE FUNCTION public.get_public_profile(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    visibility_mode TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.display_name,
        u.bio,
        u.avatar_url,
        u.cover_image_url,
        u.visibility_mode,
        u.created_at
    FROM public.users u
    WHERE u.profile_slug = p_slug
    AND u.visibility_mode IN ('PUBLIC', 'PUBLIC_LOCKED');
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get public galleries for a profile
CREATE OR REPLACE FUNCTION public.get_public_galleries(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    is_locked BOOLEAN,
    cover_image_id UUID,
    image_count BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.slug,
        g.is_locked,
        g.cover_image_id,
        (SELECT COUNT(*) FROM public.images i WHERE i.gallery_id = g.id) as image_count,
        g.created_at
    FROM public.galleries g
    WHERE g.user_id = p_user_id
    ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to clean up expired unlock tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_unlock_tokens()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.gallery_unlock_tokens
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: RLS POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS on gallery_unlock_tokens
ALTER TABLE public.gallery_unlock_tokens ENABLE ROW LEVEL SECURITY;

-- Service role can manage unlock tokens
CREATE POLICY "unlock_tokens_service_all"
    ON public.gallery_unlock_tokens
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- PART 6: UPDATE EXISTING RLS POLICIES
-- ============================================

-- Drop existing public read policy for users if it exists
DROP POLICY IF EXISTS "users_select_public" ON public.users;

-- Create new policy allowing public read of PUBLIC/PUBLIC_LOCKED profiles
CREATE POLICY "users_select_public"
    ON public.users
    FOR SELECT
    USING (
        visibility_mode IN ('PUBLIC', 'PUBLIC_LOCKED')
        OR clerk_id = auth.jwt() ->> 'sub'
    );

-- ============================================
-- ROLLBACK SCRIPT (run separately if needed)
-- ============================================
/*
-- Rollback Part 1
ALTER TABLE public.users DROP COLUMN IF EXISTS visibility_mode;
ALTER TABLE public.users DROP COLUMN IF EXISTS profile_slug;
ALTER TABLE public.users DROP COLUMN IF EXISTS profile_pin_hash;
ALTER TABLE public.users DROP COLUMN IF EXISTS display_name;
ALTER TABLE public.users DROP COLUMN IF EXISTS bio;
ALTER TABLE public.users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE public.users DROP COLUMN IF EXISTS cover_image_url;
DROP INDEX IF EXISTS idx_users_visibility_mode;
DROP INDEX IF EXISTS idx_users_profile_slug;

-- Rollback Part 2
ALTER TABLE public.galleries DROP COLUMN IF EXISTS is_locked;
ALTER TABLE public.galleries DROP COLUMN IF EXISTS lock_pin_hash;
DROP INDEX IF EXISTS idx_galleries_is_locked;

-- Rollback Part 3
DROP TABLE IF EXISTS public.gallery_unlock_tokens;

-- Rollback Part 4
DROP FUNCTION IF EXISTS public.generate_profile_slug(UUID);
DROP FUNCTION IF EXISTS public.get_public_profile(TEXT);
DROP FUNCTION IF EXISTS public.get_public_galleries(UUID);
DROP FUNCTION IF EXISTS public.cleanup_expired_unlock_tokens();

-- Rollback Part 6
DROP POLICY IF EXISTS "users_select_public" ON public.users;
*/
