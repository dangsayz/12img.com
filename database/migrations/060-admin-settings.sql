-- Migration: Admin Settings & System Configuration
-- Date: 2024-12-09
-- Purpose: God-mode system settings, maintenance mode, and health monitoring

-- ============================================================================
-- SYSTEM SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  value_type TEXT NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json', 'array'
  category TEXT NOT NULL DEFAULT 'general', -- 'general', 'email', 'storage', 'billing', 'security'
  name TEXT NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false, -- If true, value is masked in UI
  is_readonly BOOLEAN DEFAULT false, -- If true, cannot be changed via UI
  validation_schema JSONB, -- Optional JSON schema for validation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- ============================================================================
-- MAINTENANCE WINDOWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT, -- Message shown to users
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  allow_admins BOOLEAN DEFAULT true, -- Allow admin access during maintenance
  affected_services TEXT[] DEFAULT '{}', -- ['uploads', 'downloads', 'auth', 'all']
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_active ON maintenance_windows(is_active);
CREATE INDEX IF NOT EXISTS idx_maintenance_dates ON maintenance_windows(starts_at, ends_at);

-- ============================================================================
-- SYSTEM HEALTH CHECKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL, -- 'database', 'storage', 'stripe', 'resend', 'clerk'
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down', 'unknown'
  response_time_ms INTEGER,
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  last_healthy_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_health_service ON system_health_checks(service);

-- ============================================================================
-- SETTINGS CHANGE HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_history_key ON settings_history(setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_history_date ON settings_history(changed_at);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get a setting value
CREATE OR REPLACE FUNCTION get_setting(p_key TEXT)
RETURNS JSONB AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT value INTO setting_value FROM system_settings WHERE key = p_key;
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get a setting value as text
CREATE OR REPLACE FUNCTION get_setting_text(p_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT value INTO setting_value FROM system_settings WHERE key = p_key;
  RETURN setting_value::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update a setting
CREATE OR REPLACE FUNCTION update_setting(
  p_key TEXT,
  p_value JSONB,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  old_value JSONB;
  is_read_only BOOLEAN;
BEGIN
  -- Check if setting exists and is not readonly
  SELECT value, is_readonly INTO old_value, is_read_only 
  FROM system_settings WHERE key = p_key;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Setting not found: %', p_key;
  END IF;
  
  IF is_read_only THEN
    RAISE EXCEPTION 'Setting is read-only: %', p_key;
  END IF;
  
  -- Update setting
  UPDATE system_settings 
  SET value = p_value, updated_at = NOW(), updated_by = p_admin_id
  WHERE key = p_key;
  
  -- Log change
  INSERT INTO settings_history (setting_key, old_value, new_value, changed_by, reason)
  VALUES (p_key, old_value, p_value, p_admin_id, p_reason);
  
  -- Log to admin audit
  INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, target_identifier, metadata)
  VALUES (
    p_admin_id,
    'system.settings_update',
    'setting',
    (SELECT id FROM system_settings WHERE key = p_key),
    p_key,
    jsonb_build_object('old_value', old_value, 'new_value', p_value, 'reason', p_reason)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all settings by category
CREATE OR REPLACE FUNCTION get_settings_by_category(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  key TEXT,
  value JSONB,
  value_type TEXT,
  category TEXT,
  name TEXT,
  description TEXT,
  is_sensitive BOOLEAN,
  is_readonly BOOLEAN,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.key,
    CASE WHEN ss.is_sensitive THEN '"[REDACTED]"'::JSONB ELSE ss.value END as value,
    ss.value_type,
    ss.category,
    ss.name,
    ss.description,
    ss.is_sensitive,
    ss.is_readonly,
    ss.updated_at
  FROM system_settings ss
  WHERE p_category IS NULL OR ss.category = p_category
  ORDER BY ss.category, ss.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if maintenance mode is active
CREATE OR REPLACE FUNCTION is_maintenance_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM maintenance_windows 
    WHERE is_active = true 
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get active maintenance window
CREATE OR REPLACE FUNCTION get_active_maintenance()
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  severity TEXT,
  affected_services TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mw.id,
    mw.title,
    mw.message,
    mw.starts_at,
    mw.ends_at,
    mw.severity,
    mw.affected_services
  FROM maintenance_windows mw
  WHERE mw.is_active = true 
    AND (mw.starts_at IS NULL OR mw.starts_at <= NOW())
    AND (mw.ends_at IS NULL OR mw.ends_at > NOW())
  ORDER BY mw.starts_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle maintenance mode
CREATE OR REPLACE FUNCTION toggle_maintenance(
  p_enabled BOOLEAN,
  p_title TEXT,
  p_message TEXT,
  p_admin_id UUID,
  p_severity TEXT DEFAULT 'info',
  p_ends_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  window_id UUID;
BEGIN
  IF p_enabled THEN
    -- Create new maintenance window
    INSERT INTO maintenance_windows (title, message, starts_at, ends_at, is_active, severity, created_by)
    VALUES (p_title, p_message, NOW(), p_ends_at, true, p_severity, p_admin_id)
    RETURNING id INTO window_id;
    
    -- Log to admin audit
    INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (
      p_admin_id,
      'system.maintenance_on',
      'maintenance_window',
      window_id,
      jsonb_build_object('title', p_title, 'message', p_message, 'severity', p_severity)
    );
  ELSE
    -- Deactivate all active windows
    UPDATE maintenance_windows SET is_active = false, ends_at = NOW()
    WHERE is_active = true
    RETURNING id INTO window_id;
    
    -- Log to admin audit
    INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (
      p_admin_id,
      'system.maintenance_off',
      'maintenance_window',
      window_id,
      jsonb_build_object('ended_at', NOW())
    );
  END IF;
  
  RETURN window_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update health check
CREATE OR REPLACE FUNCTION update_health_check(
  p_service TEXT,
  p_status TEXT,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO system_health_checks (service, status, response_time_ms, error_message, metadata, last_healthy_at)
  VALUES (
    p_service, 
    p_status, 
    p_response_time_ms, 
    p_error_message, 
    p_metadata,
    CASE WHEN p_status = 'healthy' THEN NOW() ELSE NULL END
  )
  ON CONFLICT (service) DO UPDATE SET
    status = EXCLUDED.status,
    response_time_ms = EXCLUDED.response_time_ms,
    error_message = EXCLUDED.error_message,
    metadata = EXCLUDED.metadata,
    last_check_at = NOW(),
    last_healthy_at = CASE 
      WHEN EXCLUDED.status = 'healthy' THEN NOW() 
      ELSE system_health_checks.last_healthy_at 
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DEFAULT SETTINGS
-- ============================================================================

INSERT INTO system_settings (key, value, value_type, category, name, description, is_sensitive, is_readonly) VALUES
  -- General
  ('site_name', '"12img"', 'string', 'general', 'Site Name', 'The name of the platform', false, false),
  ('site_tagline', '"Professional Photo Galleries"', 'string', 'general', 'Site Tagline', 'Tagline shown in various places', false, false),
  ('support_email', '"support@12img.com"', 'string', 'general', 'Support Email', 'Email for support inquiries', false, false),
  ('default_timezone', '"America/Chicago"', 'string', 'general', 'Default Timezone', 'Default timezone for new users', false, false),
  
  -- Email
  ('email_sender_name', '"12img"', 'string', 'email', 'Email Sender Name', 'Name shown in email From field', false, false),
  ('email_reply_to', '"hello@12img.com"', 'string', 'email', 'Reply-To Email', 'Reply-to address for emails', false, false),
  ('email_footer_text', '"Sent with love from 12img"', 'string', 'email', 'Email Footer', 'Text shown in email footers', false, false),
  
  -- Storage
  ('max_file_size_mb', '50', 'number', 'storage', 'Max File Size (MB)', 'Maximum upload file size in MB', false, false),
  ('allowed_file_types', '["jpg", "jpeg", "png", "gif", "webp", "heic"]', 'array', 'storage', 'Allowed File Types', 'File extensions allowed for upload', false, false),
  ('compression_quality', '85', 'number', 'storage', 'Compression Quality', 'JPEG compression quality (1-100)', false, false),
  
  -- Billing
  ('trial_days', '0', 'number', 'billing', 'Trial Period (Days)', 'Number of days for free trial', false, false),
  ('grace_period_days', '3', 'number', 'billing', 'Grace Period (Days)', 'Days after failed payment before suspension', false, false),
  
  -- Security
  ('session_timeout_hours', '168', 'number', 'security', 'Session Timeout (Hours)', 'How long before sessions expire', false, false),
  ('max_login_attempts', '5', 'number', 'security', 'Max Login Attempts', 'Failed attempts before lockout', false, false),
  ('admin_ip_allowlist', '[]', 'array', 'security', 'Admin IP Allowlist', 'IPs allowed to access admin panel (empty = all)', true, false),
  ('require_2fa_admin', 'false', 'boolean', 'security', 'Require 2FA for Admins', 'Force 2FA for admin accounts', false, false)
ON CONFLICT (key) DO NOTHING;

-- Seed initial health checks
INSERT INTO system_health_checks (service, status) VALUES
  ('database', 'healthy'),
  ('storage', 'unknown'),
  ('stripe', 'unknown'),
  ('resend', 'unknown'),
  ('clerk', 'unknown')
ON CONFLICT (service) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE system_settings IS 'Platform-wide configuration settings';
COMMENT ON TABLE maintenance_windows IS 'Scheduled and active maintenance periods';
COMMENT ON TABLE system_health_checks IS 'Service health status tracking';
COMMENT ON FUNCTION is_maintenance_active IS 'Check if platform is in maintenance mode';
COMMENT ON FUNCTION toggle_maintenance IS 'Enable or disable maintenance mode';
