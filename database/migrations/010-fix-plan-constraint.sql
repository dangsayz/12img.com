-- Migration: Fix plan constraint to match pricing config
-- Updates allowed plan values: free, essential, pro, studio, elite

-- Drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;

-- Add new constraint with all plan tiers
ALTER TABLE users ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('free', 'essential', 'pro', 'studio', 'elite'));

-- Update any 'basic' plans to 'essential' (if they exist)
UPDATE users SET plan = 'essential' WHERE plan = 'basic';
