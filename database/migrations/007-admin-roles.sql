-- Migration: Admin Roles System
-- Adds role-based access control for admin panel

-- Create role enum type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'support', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Add admin metadata columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS storage_limit_override BIGINT, -- bytes, null = use plan default
ADD COLUMN IF NOT EXISTS image_limit_override INTEGER, -- null = use plan default
ADD COLUMN IF NOT EXISTS gallery_limit_override INTEGER; -- null = use plan default

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended);

-- Add comments
COMMENT ON COLUMN users.role IS 'User role: user, support, admin, super_admin';
COMMENT ON COLUMN users.is_suspended IS 'Whether user account is suspended';
COMMENT ON COLUMN users.storage_limit_override IS 'Custom storage limit in bytes (overrides plan)';
COMMENT ON COLUMN users.image_limit_override IS 'Custom image limit (overrides plan)';
COMMENT ON COLUMN users.gallery_limit_override IS 'Custom gallery limit (overrides plan)';

-- Function to check if user has admin access
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN user_role IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN user_role = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
