-- Migration: Photo derivatives table
-- Stores pre-generated image derivatives at various sizes

CREATE TABLE IF NOT EXISTS photo_derivatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference to source image
  photo_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  
  -- Derivative specification
  size_code TEXT NOT NULL,  -- xs, sm, md, lg, xl
  storage_path TEXT NOT NULL,
  
  -- Dimensions and size
  width INTEGER NOT NULL,
  height INTEGER,
  byte_size INTEGER,
  
  -- Watermark flag
  is_watermarked BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT derivatives_size_code_check 
    CHECK (size_code IN ('xs', 'sm', 'md', 'lg', 'xl')),
  CONSTRAINT derivatives_status_check 
    CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  
  -- Unique constraint: one derivative per size per photo (per watermark state)
  CONSTRAINT derivatives_unique_size 
    UNIQUE (photo_id, size_code, is_watermarked)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_derivatives_photo_id 
ON photo_derivatives(photo_id);

CREATE INDEX IF NOT EXISTS idx_derivatives_status 
ON photo_derivatives(status) 
WHERE status IN ('pending', 'processing');

-- Comments
COMMENT ON TABLE photo_derivatives IS 'Pre-generated image derivatives at various sizes for fast delivery';
COMMENT ON COLUMN photo_derivatives.size_code IS 'Derivative size: xs(200), sm(400), md(800), lg(1600), xl(2400)';
COMMENT ON COLUMN photo_derivatives.is_watermarked IS 'Whether this derivative has watermark applied';
