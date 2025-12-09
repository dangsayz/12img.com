-- Migration: Add social sharing toggle to user_settings
-- This allows photographers to enable/disable social share buttons on their public profile

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS social_sharing_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN user_settings.social_sharing_enabled IS 'Whether to show social share buttons (Pinterest, Facebook, X) on public profile images';
