-- Migration: Extend user_settings with business branding and notifications
-- Run this in Supabase SQL Editor

-- Add business branding fields
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add notification preference fields
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notify_gallery_viewed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_images_downloaded BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_archive_ready BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_digest_frequency TEXT DEFAULT 'immediate' CHECK (email_digest_frequency IN ('immediate', 'daily', 'weekly', 'never'));

-- Add gallery default fields
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS default_gallery_expiry_days INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS default_watermark_enabled BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN user_settings.business_name IS 'Business/studio name shown to clients';
COMMENT ON COLUMN user_settings.logo_url IS 'URL to uploaded business logo';
COMMENT ON COLUMN user_settings.brand_color IS 'Hex color code for brand accent';
COMMENT ON COLUMN user_settings.contact_email IS 'Public contact email (different from login)';
COMMENT ON COLUMN user_settings.website_url IS 'Business website URL';
COMMENT ON COLUMN user_settings.notify_gallery_viewed IS 'Send email when gallery is viewed';
COMMENT ON COLUMN user_settings.notify_images_downloaded IS 'Send email when images are downloaded';
COMMENT ON COLUMN user_settings.notify_archive_ready IS 'Send email when archive is ready';
COMMENT ON COLUMN user_settings.email_digest_frequency IS 'How often to send notification digests';
COMMENT ON COLUMN user_settings.default_gallery_expiry_days IS 'Default number of days until gallery expires (null = never)';
COMMENT ON COLUMN user_settings.default_watermark_enabled IS 'Whether to watermark images by default';
