-- Add onboarding fields to user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS welcome_seen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS photography_type TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add index for quick onboarding status checks
CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding 
ON user_settings(user_id) WHERE onboarding_completed = FALSE;
