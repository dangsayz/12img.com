-- Add plan column to users table
-- Run this migration in your Supabase SQL Editor

-- Add the plan column with default 'free'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' 
CHECK (plan IN ('free', 'basic', 'pro', 'studio'));

-- Create index for plan lookups
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- Comment for documentation
COMMENT ON COLUMN users.plan IS 'User subscription plan: free, basic, pro, or studio';
