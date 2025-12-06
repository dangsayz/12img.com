-- Quick Share bucket for anonymous image uploads
-- No database tracking, just storage with auto-cleanup

-- Create the quick-share bucket (public read, authenticated write via API)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quick-share',
  'quick-share',
  true,  -- Public bucket so images are directly accessible
  10485760,  -- 10MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Allow public read access to quick-share bucket
CREATE POLICY IF NOT EXISTS "Public read access for quick-share"
ON storage.objects FOR SELECT
USING (bucket_id = 'quick-share');

-- Only service role can insert (via API)
CREATE POLICY IF NOT EXISTS "Service role insert for quick-share"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quick-share');

-- Note: Images in this bucket should be cleaned up after 7 days via cron job
-- This keeps storage costs low and ensures ephemeral nature
