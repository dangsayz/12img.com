-- Add template field to galleries
-- Default is 'mosaic' - the Pic-Time style collage layout
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'mosaic';

-- Add index for template queries
CREATE INDEX IF NOT EXISTS idx_galleries_template 
ON galleries(template);

-- Comment for documentation
COMMENT ON COLUMN galleries.template IS 'Gallery display template: mosaic (default), clean-grid, cinematic, editorial';
