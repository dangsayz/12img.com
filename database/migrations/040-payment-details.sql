-- ============================================
-- Migration 040: Add Payment Details to Client Profiles
-- ============================================
-- Adds balance due date for payment tracking
-- ============================================

-- Add balance_due_date column
ALTER TABLE public.client_profiles
ADD COLUMN balance_due_date DATE;

-- Comment
COMMENT ON COLUMN public.client_profiles.balance_due_date IS 'Date when remaining balance is due';
