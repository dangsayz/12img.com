-- ============================================
-- Migration: Add Retainer Fee to Client Profiles
-- ============================================
-- Adds retainer fee field for package deposits
-- Max value: 99999 (5 digits)
-- ============================================

-- Add retainer_fee column
ALTER TABLE public.client_profiles
ADD COLUMN IF NOT EXISTS retainer_fee NUMERIC(7, 2);

-- Add constraint for max 5 digits (99999.99)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_retainer_fee'
    ) THEN
        ALTER TABLE public.client_profiles
        ADD CONSTRAINT valid_retainer_fee CHECK (
            retainer_fee IS NULL OR 
            (retainer_fee >= 0 AND retainer_fee <= 99999)
        );
    END IF;
END $$;

-- Comment
COMMENT ON COLUMN public.client_profiles.retainer_fee IS 'Retainer/deposit fee amount (max 99999)';
