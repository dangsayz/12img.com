-- ============================================
-- Migration 039: Add Retainer Fee to Client Profiles
-- ============================================
-- Adds retainer fee field for package deposits
-- Max value: 99999 (5 digits)
-- ============================================

-- Add retainer_fee column
ALTER TABLE public.client_profiles
ADD COLUMN retainer_fee NUMERIC(7, 2);

-- Add constraint for max 5 digits (99999.99)
ALTER TABLE public.client_profiles
ADD CONSTRAINT valid_retainer_fee CHECK (
    retainer_fee IS NULL OR 
    (retainer_fee >= 0 AND retainer_fee <= 99999)
);

-- Comment
COMMENT ON COLUMN public.client_profiles.retainer_fee IS 'Retainer/deposit fee amount (max 99999)';
