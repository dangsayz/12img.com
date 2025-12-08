-- Migration: Add focal point columns to images table
-- Allows users to set a custom crop center point for each image

-- Add focal point columns (nullable, defaults to center if not set)
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS focal_x NUMERIC(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS focal_y NUMERIC(5,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN images.focal_x IS 'Horizontal focal point percentage (0-100). NULL defaults to 50 (center).';
COMMENT ON COLUMN images.focal_y IS 'Vertical focal point percentage (0-100). NULL defaults to 50 (center).';

-- Create index for quick lookups when rendering galleries
CREATE INDEX IF NOT EXISTS idx_images_focal_point 
ON images (gallery_id) 
WHERE focal_x IS NOT NULL OR focal_y IS NOT NULL;
