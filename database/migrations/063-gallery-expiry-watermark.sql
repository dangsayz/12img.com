-- ============================================
-- Migration 063: Gallery Expiration & Watermark
-- ============================================
-- Adds expires_at and watermark_enabled columns to galleries
-- These are populated from user's Gallery Default settings when creating new galleries
-- ============================================

-- Add expires_at column for gallery expiration
ALTER TABLE public.galleries
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add watermark_enabled column
ALTER TABLE public.galleries
ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN NOT NULL DEFAULT false;

-- Create index for querying expired galleries (for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_galleries_expires_at 
ON public.galleries(expires_at) 
WHERE expires_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.galleries.expires_at IS 'When the gallery expires and becomes inaccessible (null = never expires)';
COMMENT ON COLUMN public.galleries.watermark_enabled IS 'Whether images in this gallery should be watermarked';

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
/*
ALTER TABLE public.galleries DROP COLUMN IF EXISTS expires_at;
ALTER TABLE public.galleries DROP COLUMN IF EXISTS watermark_enabled;
DROP INDEX IF EXISTS idx_galleries_expires_at;
*/
