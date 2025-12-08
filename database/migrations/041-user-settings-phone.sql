-- Migration: Add phone column to user_settings
-- This allows photographers to set their business phone number for contracts

-- Add phone column
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add location column for business address
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS business_location TEXT;

-- Comment for documentation
COMMENT ON COLUMN user_settings.phone IS 'Business phone number for contracts and client communication';
COMMENT ON COLUMN user_settings.business_location IS 'Business location/city for contracts';
