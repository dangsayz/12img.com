-- Migration: Add social media links to user_settings
-- These are collected during onboarding and displayed on public profile

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- Comments for documentation
COMMENT ON COLUMN user_settings.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN user_settings.tiktok_url IS 'TikTok profile URL';
COMMENT ON COLUMN user_settings.facebook_url IS 'Facebook page URL';
