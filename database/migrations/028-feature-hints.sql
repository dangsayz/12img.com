-- Add dismissed_hints to track which feature hints users have dismissed
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS dismissed_hints TEXT[] DEFAULT '{}';

-- Example hint IDs: 'email-tracking', 'focal-point', 'editorial-view', etc.
COMMENT ON COLUMN user_settings.dismissed_hints IS 'Array of hint IDs the user has dismissed (one-time tooltips)';
