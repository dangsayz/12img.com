-- Migration: Feature Flags & System Settings
-- Dynamic feature toggles and system configuration

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  
  -- Targeting
  enabled_for_plans TEXT[] DEFAULT '{}', -- specific plans only
  enabled_for_users UUID[] DEFAULT '{}', -- specific users only
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- System settings table (key-value store)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Maintenance mode table
CREATE TABLE IF NOT EXISTS maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  allow_admins BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default feature flags
INSERT INTO feature_flags (key, name, description, enabled) VALUES
  ('new_upload_flow', 'New Upload Flow', 'Enable the redesigned upload experience', true),
  ('ai_image_tagging', 'AI Image Tagging', 'Automatic image tagging using AI', false),
  ('video_support', 'Video Support', 'Allow video uploads (future feature)', false),
  ('raw_support', 'RAW File Support', 'Support for RAW image formats', false),
  ('gallery_templates', 'Gallery Templates', 'Pre-designed gallery templates', false),
  ('client_portal', 'Client Portal', 'Self-service client portal', false),
  ('bulk_download', 'Bulk Download', 'Download all gallery images as ZIP', true),
  ('email_notifications', 'Email Notifications', 'Send email notifications', true),
  ('stripe_billing', 'Stripe Billing', 'Enable Stripe payment processing', true)
ON CONFLICT (key) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Global maintenance mode'),
  ('signup_enabled', 'true', 'Allow new user signups'),
  ('max_upload_size_mb', '50', 'Maximum upload file size in MB'),
  ('default_gallery_expiry_days', '7', 'Default expiry for free galleries'),
  ('email_rate_limit', '{"per_minute": 10, "per_hour": 100}', 'Email sending rate limits')
ON CONFLICT (key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_maintenance_windows_active ON maintenance_windows(is_active);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_windows ENABLE ROW LEVEL SECURITY;

-- Policies - anyone can read, only admins can write
CREATE POLICY "Anyone can read feature flags" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "Admins can manage feature flags" ON feature_flags FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role IN ('admin', 'super_admin')));

CREATE POLICY "Anyone can read system settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage system settings" ON system_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role IN ('admin', 'super_admin')));

CREATE POLICY "Anyone can read maintenance windows" ON maintenance_windows FOR SELECT USING (true);
CREATE POLICY "Admins can manage maintenance windows" ON maintenance_windows FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role IN ('admin', 'super_admin')));

-- Helper function to check feature flag
CREATE OR REPLACE FUNCTION is_feature_enabled(
  p_key TEXT,
  p_user_id UUID DEFAULT NULL,
  p_plan TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_flag RECORD;
BEGIN
  SELECT * INTO v_flag FROM feature_flags WHERE key = p_key;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if globally disabled
  IF NOT v_flag.enabled THEN
    RETURN false;
  END IF;
  
  -- Check user targeting
  IF array_length(v_flag.enabled_for_users, 1) > 0 THEN
    IF p_user_id IS NOT NULL AND p_user_id = ANY(v_flag.enabled_for_users) THEN
      RETURN true;
    END IF;
    RETURN false;
  END IF;
  
  -- Check plan targeting
  IF array_length(v_flag.enabled_for_plans, 1) > 0 THEN
    IF p_plan IS NOT NULL AND p_plan = ANY(v_flag.enabled_for_plans) THEN
      RETURN true;
    END IF;
    RETURN false;
  END IF;
  
  -- Check rollout percentage (simple random)
  IF v_flag.rollout_percentage < 100 THEN
    RETURN random() * 100 < v_flag.rollout_percentage;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
