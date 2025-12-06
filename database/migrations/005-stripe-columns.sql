-- Migration: Add Stripe columns to users table
-- Run this in Supabase SQL Editor

-- Add Stripe-related columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Add storage tracking columns for plan limits
ALTER TABLE users
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Active Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN users.storage_used IS 'Total storage used in bytes';
COMMENT ON COLUMN users.image_count IS 'Total number of images uploaded';
