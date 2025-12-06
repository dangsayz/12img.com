-- Migration: Admin Plan Expiry
-- Allows admin-granted plans to expire after a set period

-- Add expiry column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin_plan_expires_at TIMESTAMPTZ;

-- Add column to track who granted the plan
ALTER TABLE users
ADD COLUMN IF NOT EXISTS admin_plan_granted_by UUID REFERENCES users(id);

-- Add column to track when it was granted
ALTER TABLE users
ADD COLUMN IF NOT EXISTS admin_plan_granted_at TIMESTAMPTZ;

-- Index for finding expired plans
CREATE INDEX IF NOT EXISTS idx_users_admin_plan_expires 
ON users(admin_plan_expires_at) 
WHERE admin_plan_expires_at IS NOT NULL;

-- Comment
COMMENT ON COLUMN users.admin_plan_expires_at IS 'When admin-granted plan expires (null = never expires or paid plan)';
COMMENT ON COLUMN users.admin_plan_granted_by IS 'Admin who granted the plan override';
COMMENT ON COLUMN users.admin_plan_granted_at IS 'When the plan was granted by admin';
