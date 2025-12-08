-- ============================================
-- Migration 028: Portfolio Enhancements
-- - Per-image portfolio visibility
-- - Profile slug history for redirects
-- - Auto-generate slug from business name
-- ============================================

-- ============================================
-- PART 1: PER-IMAGE PORTFOLIO VISIBILITY
-- ============================================

-- Add portfolio visibility to images
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS show_in_portfolio BOOLEAN NOT NULL DEFAULT TRUE;

-- Index for portfolio queries
CREATE INDEX IF NOT EXISTS idx_images_show_in_portfolio ON public.images(show_in_portfolio);

-- ============================================
-- PART 2: PROFILE SLUG HISTORY (for redirects)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profile_slug_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    old_slug TEXT NOT NULL,
    new_slug TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_profile_slug_history_old_slug ON public.profile_slug_history(old_slug);
CREATE INDEX IF NOT EXISTS idx_profile_slug_history_user_id ON public.profile_slug_history(user_id);

-- ============================================
-- PART 3: PORTFOLIO IMAGES TABLE
-- Selected images to feature on portfolio
-- ============================================

CREATE TABLE IF NOT EXISTS public.portfolio_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, image_id)
);

-- Index for portfolio queries
CREATE INDEX IF NOT EXISTS idx_portfolio_images_user_id ON public.portfolio_images(user_id);

-- ============================================
-- PART 4: HELPER FUNCTIONS
-- ============================================

-- Function to generate slug from business name
CREATE OR REPLACE FUNCTION public.generate_slug_from_name(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_slug TEXT;
BEGIN
    -- Convert to lowercase, replace spaces/special chars with hyphens
    v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Trim leading/trailing hyphens
    v_slug := trim(both '-' from v_slug);
    -- Ensure minimum length
    IF length(v_slug) < 3 THEN
        v_slug := v_slug || '-studio';
    END IF;
    RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to get unique slug (appends number if taken)
CREATE OR REPLACE FUNCTION public.get_unique_profile_slug(p_base_slug TEXT, p_user_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    v_slug TEXT;
    v_counter INTEGER := 0;
BEGIN
    v_slug := p_base_slug;
    
    -- Check if slug is taken (excluding current user)
    WHILE EXISTS (
        SELECT 1 FROM public.users 
        WHERE profile_slug = v_slug 
        AND (p_user_id IS NULL OR id != p_user_id)
    ) OR EXISTS (
        SELECT 1 FROM public.profile_slug_history
        WHERE old_slug = v_slug
        AND expires_at > NOW()
    ) LOOP
        v_counter := v_counter + 1;
        v_slug := p_base_slug || '-' || v_counter;
    END LOOP;
    
    RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to get portfolio images for a user
CREATE OR REPLACE FUNCTION public.get_portfolio_images(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    image_id UUID,
    storage_path TEXT,
    gallery_id UUID,
    gallery_title TEXT,
    width INTEGER,
    height INTEGER,
    focal_x NUMERIC,
    focal_y NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as image_id,
        i.storage_path,
        i.gallery_id,
        g.title as gallery_title,
        i.width,
        i.height,
        i.focal_x,
        i.focal_y
    FROM public.images i
    JOIN public.galleries g ON g.id = i.gallery_id
    LEFT JOIN public.portfolio_images pi ON pi.image_id = i.id AND pi.user_id = p_user_id
    WHERE g.user_id = p_user_id
    AND i.show_in_portfolio = TRUE
    ORDER BY pi.position NULLS LAST, i.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to redirect old slugs
CREATE OR REPLACE FUNCTION public.get_redirect_slug(p_old_slug TEXT)
RETURNS TEXT AS $$
DECLARE
    v_new_slug TEXT;
BEGIN
    SELECT u.profile_slug INTO v_new_slug
    FROM public.profile_slug_history h
    JOIN public.users u ON u.id = h.user_id
    WHERE h.old_slug = p_old_slug
    AND h.expires_at > NOW()
    ORDER BY h.changed_at DESC
    LIMIT 1;
    
    RETURN v_new_slug;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PART 5: RLS POLICIES
-- ============================================

ALTER TABLE public.profile_slug_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;

-- Service role can manage all (drop first if exists)
DROP POLICY IF EXISTS "slug_history_service_all" ON public.profile_slug_history;
DROP POLICY IF EXISTS "portfolio_images_service_all" ON public.portfolio_images;

CREATE POLICY "slug_history_service_all" ON public.profile_slug_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "portfolio_images_service_all" ON public.portfolio_images FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- ROLLBACK
-- ============================================
/*
ALTER TABLE public.images DROP COLUMN IF EXISTS show_in_portfolio;
DROP INDEX IF EXISTS idx_images_show_in_portfolio;
DROP TABLE IF EXISTS public.profile_slug_history;
DROP TABLE IF EXISTS public.portfolio_images;
DROP FUNCTION IF EXISTS public.generate_slug_from_name(TEXT);
DROP FUNCTION IF EXISTS public.get_unique_profile_slug(TEXT, UUID);
DROP FUNCTION IF EXISTS public.get_portfolio_images(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_redirect_slug(TEXT);
*/
