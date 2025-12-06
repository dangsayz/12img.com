-- Migration: Admin Audit Logs
-- Tracks all administrative actions for security and compliance

-- Create audit action enum
DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    -- User actions
    'user.view',
    'user.suspend',
    'user.reactivate',
    'user.update_limits',
    'user.update_plan',
    'user.delete',
    'user.impersonate',
    'user.force_logout',
    -- Gallery actions
    'gallery.view',
    'gallery.delete',
    'gallery.restore',
    -- Storage actions
    'storage.cleanup',
    'storage.delete_file',
    -- Billing actions
    'billing.override_plan',
    'billing.sync',
    'billing.refund',
    -- Email actions
    'email.send_single',
    'email.send_broadcast',
    -- System actions
    'system.maintenance_on',
    'system.maintenance_off',
    'system.feature_flag_update',
    'system.settings_update',
    -- Admin actions
    'admin.role_change',
    'admin.login',
    'admin.logout'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create audit logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  admin_id UUID NOT NULL REFERENCES users(id),
  admin_email TEXT NOT NULL,
  admin_role user_role NOT NULL,
  
  -- What action was performed
  action audit_action NOT NULL,
  
  -- Target of the action (if applicable)
  target_type TEXT, -- 'user', 'gallery', 'storage', etc.
  target_id UUID,
  target_identifier TEXT, -- email, slug, path, etc.
  
  -- Additional context
  metadata JSONB DEFAULT '{}',
  
  -- Request info
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- Composite index for admin activity view
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_time 
ON admin_audit_logs(admin_id, created_at DESC);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.clerk_id = auth.uid()::text 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Only server (service role) can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON admin_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Function to log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action audit_action,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_target_identifier TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
  v_admin_role user_role;
BEGIN
  -- Get admin info
  SELECT email, role INTO v_admin_email, v_admin_role
  FROM users WHERE id = p_admin_id;
  
  -- Insert log entry
  INSERT INTO admin_audit_logs (
    admin_id, admin_email, admin_role,
    action, target_type, target_id, target_identifier,
    metadata
  ) VALUES (
    p_admin_id, v_admin_email, v_admin_role,
    p_action, p_target_type, p_target_id, p_target_identifier,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE admin_audit_logs IS 'Audit trail for all administrative actions';
COMMENT ON FUNCTION log_admin_action IS 'Helper function to log admin actions with context';
