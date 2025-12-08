-- Migration: Add processing status to images
-- Tracks derivative generation state for each uploaded image

-- Add processing status column
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'pending';

-- Add processing version for reprocessing support
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS processing_version INTEGER NOT NULL DEFAULT 1;

-- Add check constraint for valid statuses
ALTER TABLE images 
ADD CONSTRAINT images_processing_status_check 
CHECK (processing_status IN ('pending', 'processing', 'ready', 'failed'));

-- Index for finding images that need processing
CREATE INDEX IF NOT EXISTS idx_images_processing_status 
ON images(processing_status) 
WHERE processing_status IN ('pending', 'processing');

-- Comment
COMMENT ON COLUMN images.processing_status IS 'Derivative generation status: pending, processing, ready, failed';
COMMENT ON COLUMN images.processing_version IS 'Increment to trigger reprocessing of derivatives';
