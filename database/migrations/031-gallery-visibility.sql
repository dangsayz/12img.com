-- ============================================
-- Migration 031: Gallery Visibility
-- ============================================
-- Adds per-gallery public/private visibility control
-- Private galleries cannot be accessed via public URLs
-- ============================================

-- Add is_public column to galleries (default true for backwards compatibility)
ALTER TABLE public.galleries 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- Add index for filtering public galleries
CREATE INDEX IF NOT EXISTS idx_galleries_is_public ON public.galleries(is_public);

-- Comment
COMMENT ON COLUMN public.galleries.is_public IS 'Whether the gallery is publicly accessible via share URLs. Private galleries can only be viewed by the owner.';
