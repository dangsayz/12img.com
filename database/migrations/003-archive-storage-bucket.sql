-- ============================================
-- Migration: 003-archive-storage-bucket
-- Storage bucket for ZIP archives
-- ============================================

-- Create the gallery-archives bucket
-- Run this via Supabase Dashboard or API:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'gallery-archives',
--   'gallery-archives',
--   false,
--   5368709120,  -- 5GB max file size for large archives
--   ARRAY['application/zip', 'application/x-zip-compressed']
-- );

-- Note: The bucket creation should be done via Supabase Dashboard or API
-- This file documents the storage policies that need to be applied

-- ============================================
-- STORAGE POLICIES for gallery-archives bucket
-- ============================================

-- Service role can upload archives (used by workers)
CREATE POLICY "archives_insert_service"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'gallery-archives'
    );

-- Service role can read archives
CREATE POLICY "archives_select_service"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'gallery-archives'
    );

-- Service role can delete archives
CREATE POLICY "archives_delete_service"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'gallery-archives'
    );

-- Gallery owners can read their archives directly (optional - mainly use signed URLs)
CREATE POLICY "archives_select_owner"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'gallery-archives'
        AND (storage.foldername(name))[1] = 'galleries'
        AND (storage.foldername(name))[2] IN (
            SELECT g.id::text FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- ============================================
-- NOTE ON IMPLEMENTATION
-- ============================================
-- 
-- The storage bucket needs to be created manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket called "gallery-archives"
-- 3. Set it to private (not public)
-- 4. Set file size limit to 5GB (or appropriate for your needs)
-- 5. Allow only application/zip mime type
--
-- For production, consider:
-- - Setting up lifecycle rules to auto-delete old archives
-- - Using S3 Intelligent-Tiering or similar for cost optimization
-- - Implementing CDN caching for frequently accessed archives
