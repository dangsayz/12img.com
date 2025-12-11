-- ============================================================================
-- Migration: Image Favorites for Public Portfolio
-- ============================================================================
-- Adds ability to mark images as favorites which appear on public profile
-- 
-- PRIVACY RULES:
-- A favorite image ONLY appears on public portfolio if:
-- 1. Gallery visibility_mode = 'public'
-- 2. Gallery show_on_profile = true  
-- 3. Gallery is NOT archived
-- 4. Gallery has NO password protection
-- ============================================================================

-- Add is_favorite column to images table
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Create index for efficient favorite queries
CREATE INDEX IF NOT EXISTS idx_images_is_favorite 
ON public.images(gallery_id, is_favorite) 
WHERE is_favorite = true;

-- ============================================================================
-- Function: Get public favorite images for a user's profile
-- Respects all privacy settings
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_public_favorite_images(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  storage_path TEXT,
  width INTEGER,
  height INTEGER,
  focal_x REAL,
  focal_y REAL,
  gallery_id UUID,
  gallery_title TEXT,
  gallery_slug TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.storage_path,
    i.width,
    i.height,
    i.focal_x,
    i.focal_y,
    g.id as gallery_id,
    g.title as gallery_title,
    g.slug as gallery_slug
  FROM public.images i
  INNER JOIN public.galleries g ON i.gallery_id = g.id
  WHERE 
    g.user_id = target_user_id
    AND i.is_favorite = true
    -- Privacy filters:
    AND (g.visibility_mode = 'public' OR (g.visibility_mode IS NULL AND g.is_public = true))
    AND COALESCE(g.show_on_profile, true) = true
    AND g.archived_at IS NULL
    AND g.password_hash IS NULL  -- No password-protected galleries
  ORDER BY i.created_at DESC
  LIMIT 50;  -- Cap at 50 favorites for performance
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_public_favorite_images(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_favorite_images(UUID) TO anon;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON COLUMN public.images.is_favorite IS 'Mark image as favorite to appear on public portfolio (subject to gallery privacy settings)';
COMMENT ON FUNCTION public.get_public_favorite_images IS 'Get favorite images for public profile display, respecting gallery privacy settings';
