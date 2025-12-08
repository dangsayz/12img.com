-- Gallery Presentation Metadata
-- Stores optional story/presentation details for premium gallery delivery experience

-- Add presentation columns to galleries table
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS presentation_data JSONB DEFAULT NULL;

-- The presentation_data JSONB structure:
-- {
--   "eventDate": "2024-10-22",
--   "eventType": "wedding" | "engagement" | "portrait" | "maternity" | "newborn" | "family" | "corporate" | "other",
--   "coupleNames": { "partner1": "Lexie", "partner2": "Taylor" },
--   "subtitle": "A love story in the hills of Tuscany",
--   "quote": "In all the world, there is no heart for me like yours.",
--   "quoteAttribution": "Maya Angelou",
--   "venue": "Villa Cimbrone, Ravello",
--   "location": "Amalfi Coast, Italy",
--   "coverImageId": "uuid-of-selected-cover-image",
--   "heroLayout": "centered" | "split" | "fullbleed" | "editorial",
--   "colorScheme": "light" | "dark" | "warm" | "cool" | "auto",
--   "typography": "classic" | "modern" | "editorial" | "romantic",
--   "showPhotographerCredit": true,
--   "customMessage": "Thank you for letting us capture your special day...",
--   "musicUrl": "optional-background-music-url",
--   "enableAnimations": true
-- }

-- Index for faster queries on presentation data
CREATE INDEX IF NOT EXISTS idx_galleries_presentation 
ON galleries USING GIN (presentation_data) 
WHERE presentation_data IS NOT NULL;

-- Add a column for featured/cover image selection (separate from presentation_data for easier querying)
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS cover_image_id UUID REFERENCES images(id) ON DELETE SET NULL;

-- Create index for cover image lookups
CREATE INDEX IF NOT EXISTS idx_galleries_cover_image ON galleries(cover_image_id) WHERE cover_image_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN galleries.presentation_data IS 'JSONB containing optional presentation metadata for premium gallery delivery (event details, quotes, styling preferences)';
COMMENT ON COLUMN galleries.cover_image_id IS 'Reference to the image selected as the gallery cover/hero image';
