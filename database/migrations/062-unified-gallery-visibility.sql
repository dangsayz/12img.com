-- ============================================
-- Migration 062: Unified Gallery Visibility System
-- ============================================
-- Addresses visibility logic gaps:
-- 1. Private gallery titles visible on public profile → add show_on_profile flag
-- 2. Client-only gallery access → add client_profile_id link
-- 3. Direct link bypasses profile privacy → add respect_profile_visibility flag
-- 4. Double auth (profile PIN + gallery password) → add inherit_profile_pin flag
-- 5. No "lock everything" toggle → handled at application layer with profile visibility
-- ============================================

-- ============================================
-- PART 1: NEW GALLERY VISIBILITY FIELDS
-- ============================================

-- Add visibility_mode enum for galleries (more explicit than boolean)
-- 'public' = Anyone can view via direct link
-- 'client_only' = Only linked client(s) can view via portal
-- 'private' = Only owner can view
ALTER TABLE public.galleries
ADD COLUMN IF NOT EXISTS visibility_mode TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility_mode IN ('public', 'client_only', 'private'));

-- Migrate existing is_public to visibility_mode
UPDATE public.galleries 
SET visibility_mode = CASE 
    WHEN is_public = true THEN 'public'
    ELSE 'private'
END
WHERE visibility_mode = 'public'; -- Only update if still default

-- Add show_on_profile flag (separate from visibility)
-- Controls whether gallery appears in public profile gallery list
-- A gallery can be public (direct link works) but hidden from profile
ALTER TABLE public.galleries
ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN NOT NULL DEFAULT true;

-- Add respect_profile_visibility flag
-- When true, gallery respects profile-level visibility settings
-- When false, direct links work regardless of profile being PRIVATE
ALTER TABLE public.galleries
ADD COLUMN IF NOT EXISTS respect_profile_visibility BOOLEAN NOT NULL DEFAULT false;

-- Add inherit_profile_pin flag
-- When true and profile is PUBLIC_LOCKED, gallery uses profile PIN (no double auth)
-- When false, gallery uses its own password_hash if set
ALTER TABLE public.galleries
ADD COLUMN IF NOT EXISTS inherit_profile_pin BOOLEAN NOT NULL DEFAULT true;

-- ============================================
-- PART 2: CLIENT-GALLERY LINKING
-- ============================================

-- Link galleries to specific clients for client_only visibility
CREATE TABLE IF NOT EXISTS public.gallery_client_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    client_profile_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    
    -- Access permissions
    can_view BOOLEAN NOT NULL DEFAULT true,
    can_download BOOLEAN NOT NULL DEFAULT true,
    can_favorite BOOLEAN NOT NULL DEFAULT true,
    
    -- Notification preferences
    notify_on_upload BOOLEAN NOT NULL DEFAULT true,
    
    -- Tracking
    first_viewed_at TIMESTAMPTZ,
    last_viewed_at TIMESTAMPTZ,
    view_count INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    notes TEXT,
    
    -- Prevent duplicate links
    CONSTRAINT unique_gallery_client UNIQUE (gallery_id, client_profile_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_client_access_gallery ON public.gallery_client_access(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_client_access_client ON public.gallery_client_access(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_galleries_visibility_mode ON public.galleries(visibility_mode);
CREATE INDEX IF NOT EXISTS idx_galleries_show_on_profile ON public.galleries(show_on_profile) WHERE show_on_profile = true;

-- ============================================
-- PART 3: HELPER FUNCTIONS
-- ============================================

-- Function to check if a client can access a gallery
CREATE OR REPLACE FUNCTION can_client_access_gallery(
    p_gallery_id UUID,
    p_client_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_gallery RECORD;
    v_has_access BOOLEAN;
BEGIN
    -- Get gallery visibility mode
    SELECT visibility_mode, user_id INTO v_gallery
    FROM public.galleries
    WHERE id = p_gallery_id;
    
    IF v_gallery IS NULL THEN
        RETURN false;
    END IF;
    
    -- Public galleries are accessible to everyone
    IF v_gallery.visibility_mode = 'public' THEN
        RETURN true;
    END IF;
    
    -- Private galleries only accessible to owner (not clients)
    IF v_gallery.visibility_mode = 'private' THEN
        RETURN false;
    END IF;
    
    -- Client-only: check if client has explicit access
    IF v_gallery.visibility_mode = 'client_only' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.gallery_client_access
            WHERE gallery_id = p_gallery_id
            AND client_profile_id = p_client_id
            AND can_view = true
        ) INTO v_has_access;
        
        RETURN v_has_access;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get galleries visible on a profile
CREATE OR REPLACE FUNCTION get_profile_galleries(
    p_user_id UUID,
    p_viewer_is_owner BOOLEAN DEFAULT false
) RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    visibility_mode TEXT,
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
        g.visibility_mode,
        g.is_locked,
        g.cover_image_id,
        (SELECT COUNT(*) FROM public.images i WHERE i.gallery_id = g.id) as image_count,
        g.created_at
    FROM public.galleries g
    WHERE g.user_id = p_user_id
    AND g.archived_at IS NULL
    AND (
        -- Owner sees everything
        p_viewer_is_owner = true
        OR (
            -- Non-owner only sees galleries marked show_on_profile
            g.show_on_profile = true
            -- And only public or client_only (private never shown)
            AND g.visibility_mode IN ('public', 'client_only')
        )
    )
    ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check gallery access with full context
CREATE OR REPLACE FUNCTION check_gallery_access(
    p_gallery_id UUID,
    p_viewer_user_id UUID DEFAULT NULL,  -- Logged in photographer
    p_client_id UUID DEFAULT NULL,       -- Client via portal token
    p_has_password BOOLEAN DEFAULT false -- Viewer entered correct password
) RETURNS TABLE (
    can_access BOOLEAN,
    access_reason TEXT,
    requires_password BOOLEAN,
    requires_pin BOOLEAN
) AS $$
DECLARE
    v_gallery RECORD;
    v_profile RECORD;
    v_is_owner BOOLEAN;
BEGIN
    -- Get gallery and owner info
    SELECT 
        g.*,
        u.visibility_mode as profile_visibility,
        u.profile_pin_hash
    INTO v_gallery
    FROM public.galleries g
    JOIN public.users u ON u.id = g.user_id
    WHERE g.id = p_gallery_id;
    
    IF v_gallery IS NULL THEN
        RETURN QUERY SELECT false, 'Gallery not found'::TEXT, false, false;
        RETURN;
    END IF;
    
    -- Check if viewer is owner
    v_is_owner := (p_viewer_user_id IS NOT NULL AND v_gallery.user_id = p_viewer_user_id);
    
    -- Owner always has access
    IF v_is_owner THEN
        RETURN QUERY SELECT true, 'Owner access'::TEXT, false, false;
        RETURN;
    END IF;
    
    -- Check if archived
    IF v_gallery.archived_at IS NOT NULL THEN
        RETURN QUERY SELECT false, 'Gallery archived'::TEXT, false, false;
        RETURN;
    END IF;
    
    -- Check profile-level visibility if respect_profile_visibility is true
    IF v_gallery.respect_profile_visibility THEN
        IF v_gallery.profile_visibility = 'PRIVATE' THEN
            RETURN QUERY SELECT false, 'Profile is private'::TEXT, false, false;
            RETURN;
        END IF;
    END IF;
    
    -- Check gallery visibility mode
    CASE v_gallery.visibility_mode
        WHEN 'private' THEN
            RETURN QUERY SELECT false, 'Gallery is private'::TEXT, false, false;
            RETURN;
            
        WHEN 'client_only' THEN
            -- Must be a linked client
            IF p_client_id IS NULL THEN
                RETURN QUERY SELECT false, 'Client access required'::TEXT, false, false;
                RETURN;
            END IF;
            
            IF NOT can_client_access_gallery(p_gallery_id, p_client_id) THEN
                RETURN QUERY SELECT false, 'Not authorized for this gallery'::TEXT, false, false;
                RETURN;
            END IF;
            
        WHEN 'public' THEN
            -- Public access, but may need password/PIN
            NULL; -- Continue to password check
    END CASE;
    
    -- Check authentication requirements
    -- Option 1: Inherit profile PIN
    IF v_gallery.inherit_profile_pin AND v_gallery.profile_visibility = 'PUBLIC_LOCKED' THEN
        -- Need profile PIN (handled by profile PIN entry, not gallery password)
        IF NOT p_has_password THEN  -- Reuse password flag for PIN verification
            RETURN QUERY SELECT false, 'Profile PIN required'::TEXT, false, true;
            RETURN;
        END IF;
    END IF;
    
    -- Option 2: Gallery has its own password
    IF v_gallery.password_hash IS NOT NULL AND NOT v_gallery.inherit_profile_pin THEN
        IF NOT p_has_password THEN
            RETURN QUERY SELECT false, 'Password required'::TEXT, true, false;
            RETURN;
        END IF;
    END IF;
    
    -- Option 3: Gallery is locked with PIN
    IF v_gallery.is_locked AND v_gallery.lock_pin_hash IS NOT NULL THEN
        IF NOT p_has_password THEN
            RETURN QUERY SELECT false, 'Gallery PIN required'::TEXT, false, true;
            RETURN;
        END IF;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT true, 'Access granted'::TEXT, false, false;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PART 4: RLS POLICIES
-- ============================================

ALTER TABLE public.gallery_client_access ENABLE ROW LEVEL SECURITY;

-- Photographers can manage access for their own galleries
CREATE POLICY "gallery_client_access_owner"
    ON public.gallery_client_access
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.galleries g
            JOIN public.users u ON u.id = g.user_id
            WHERE g.id = gallery_id
            AND u.clerk_id = auth.jwt() ->> 'sub'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.galleries g
            JOIN public.users u ON u.id = g.user_id
            WHERE g.id = gallery_id
            AND u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Service role full access
CREATE POLICY "gallery_client_access_service"
    ON public.gallery_client_access
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- PART 5: UPDATE PORTAL TOKEN PERMISSIONS
-- ============================================

-- Add gallery-specific access to portal tokens
ALTER TABLE public.portal_tokens
ADD COLUMN IF NOT EXISTS gallery_access_ids UUID[] DEFAULT '{}';

-- Update validate function to include gallery access
CREATE OR REPLACE FUNCTION validate_portal_token_v2(p_token TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    client_id UUID,
    photographer_id UUID,
    can_view_contract BOOLEAN,
    can_sign_contract BOOLEAN,
    can_message BOOLEAN,
    can_view_gallery BOOLEAN,
    can_download BOOLEAN,
    gallery_access_ids UUID[],
    error_message TEXT
) AS $$
DECLARE
    v_token_hash TEXT;
    v_record RECORD;
BEGIN
    v_token_hash := encode(sha256(p_token::bytea), 'hex');
    
    SELECT pt.* INTO v_record
    FROM public.portal_tokens pt
    WHERE pt.token_hash = v_token_hash;
    
    IF v_record IS NULL THEN
        RETURN QUERY SELECT 
            false, NULL::UUID, NULL::UUID, false, false, false, false, false, 
            '{}'::UUID[], 'Invalid or expired link'::TEXT;
        RETURN;
    END IF;
    
    IF v_record.is_revoked THEN
        RETURN QUERY SELECT 
            false, NULL::UUID, NULL::UUID, false, false, false, false, false,
            '{}'::UUID[], 'This link has been revoked'::TEXT;
        RETURN;
    END IF;
    
    IF v_record.expires_at < NOW() THEN
        RETURN QUERY SELECT 
            false, NULL::UUID, NULL::UUID, false, false, false, false, false,
            '{}'::UUID[], 'This link has expired'::TEXT;
        RETURN;
    END IF;
    
    UPDATE public.portal_tokens
    SET last_used_at = NOW(), use_count = use_count + 1
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT 
        true,
        v_record.client_id,
        v_record.photographer_id,
        v_record.can_view_contract,
        v_record.can_sign_contract,
        v_record.can_message,
        v_record.can_view_gallery,
        v_record.can_download,
        COALESCE(v_record.gallery_access_ids, '{}'::UUID[]),
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: COMMENTS
-- ============================================

COMMENT ON COLUMN public.galleries.visibility_mode IS 
'Gallery visibility: public (anyone), client_only (linked clients via portal), private (owner only)';

COMMENT ON COLUMN public.galleries.show_on_profile IS 
'Whether gallery appears in public profile gallery list. Separate from visibility - a public gallery can be hidden from profile.';

COMMENT ON COLUMN public.galleries.respect_profile_visibility IS 
'When true, gallery respects profile-level visibility. If profile is PRIVATE, direct links wont work.';

COMMENT ON COLUMN public.galleries.inherit_profile_pin IS 
'When true and profile is PUBLIC_LOCKED, use profile PIN instead of separate gallery password. Avoids double auth.';

COMMENT ON TABLE public.gallery_client_access IS 
'Links galleries to specific clients for client_only visibility mode. Clients access via portal tokens.';

COMMENT ON FUNCTION check_gallery_access IS 
'Unified access check considering: owner, archived, profile visibility, gallery visibility, client access, password/PIN';

-- ============================================
-- PART 7: MIGRATION OF EXISTING DATA
-- ============================================

-- Set show_on_profile based on current is_public
-- Private galleries should not show on profile by default
UPDATE public.galleries
SET show_on_profile = CASE
    WHEN is_public = false THEN false
    ELSE true
END
WHERE show_on_profile = true; -- Only update defaults

-- ============================================
-- ROLLBACK SCRIPT
-- ============================================
/*
ALTER TABLE public.galleries DROP COLUMN IF EXISTS visibility_mode;
ALTER TABLE public.galleries DROP COLUMN IF EXISTS show_on_profile;
ALTER TABLE public.galleries DROP COLUMN IF EXISTS respect_profile_visibility;
ALTER TABLE public.galleries DROP COLUMN IF EXISTS inherit_profile_pin;
DROP TABLE IF EXISTS public.gallery_client_access;
DROP FUNCTION IF EXISTS can_client_access_gallery;
DROP FUNCTION IF EXISTS get_profile_galleries;
DROP FUNCTION IF EXISTS check_gallery_access;
DROP FUNCTION IF EXISTS validate_portal_token_v2;
ALTER TABLE public.portal_tokens DROP COLUMN IF EXISTS gallery_access_ids;
*/
