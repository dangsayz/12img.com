-- Migration: Profile Covers Storage Bucket
-- Creates a public bucket for profile cover images

-- Create the profile-covers bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-covers',
  'profile-covers',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Allow authenticated users to upload their own covers
CREATE POLICY "Users can upload their own profile covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own covers
CREATE POLICY "Users can update their own profile covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own covers
CREATE POLICY "Users can delete their own profile covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (covers are public)
CREATE POLICY "Profile covers are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-covers');

-- Down migration
-- DROP POLICY IF EXISTS "Users can upload their own profile covers" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own profile covers" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own profile covers" ON storage.objects;
-- DROP POLICY IF EXISTS "Profile covers are publicly accessible" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'profile-covers';
