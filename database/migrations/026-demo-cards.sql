-- Demo Cards: Free shareable photo cards for landing page demo
-- Users can upload a single image and get a beautiful shareable card

CREATE TABLE IF NOT EXISTS demo_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Image storage
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  file_size BIGINT,
  mime_type TEXT,
  
  -- Card customization
  title TEXT,
  subtitle TEXT,
  photographer_name TEXT,
  
  -- Image metadata (extracted from EXIF or set by user)
  aspect_ratio NUMERIC(5,2),
  focal_x NUMERIC(5,2) DEFAULT 50,
  focal_y NUMERIC(5,2) DEFAULT 50,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Optional: Link to user if they sign up later
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_demo_cards_created_at ON demo_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_cards_expires_at ON demo_cards(expires_at);

-- RLS Policies
ALTER TABLE demo_cards ENABLE ROW LEVEL SECURITY;

-- Anyone can view demo cards (they're public)
CREATE POLICY "Demo cards are publicly viewable"
  ON demo_cards FOR SELECT
  USING (expires_at > NOW());

-- Anyone can create demo cards (no auth required)
CREATE POLICY "Anyone can create demo cards"
  ON demo_cards FOR INSERT
  WITH CHECK (true);

-- Only the creator can update their card (if they have user_id)
CREATE POLICY "Users can update their own cards"
  ON demo_cards FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_demo_card_views(card_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE demo_cards 
  SET view_count = view_count + 1 
  WHERE id = card_id AND expires_at > NOW();
END;
$$;

-- Function to increment share count
CREATE OR REPLACE FUNCTION increment_demo_card_shares(card_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE demo_cards 
  SET share_count = share_count + 1 
  WHERE id = card_id AND expires_at > NOW();
END;
$$;

-- Cleanup function for expired cards (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_demo_cards()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM demo_cards 
    WHERE expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Storage bucket for demo cards (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('demo-cards', 'demo-cards', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for demo-cards bucket
CREATE POLICY "Demo card images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'demo-cards');

CREATE POLICY "Anyone can upload demo card images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'demo-cards');
