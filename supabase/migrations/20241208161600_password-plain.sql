-- Add password_plain column to store readable password for owner display
-- The hash is still used for validation, plain is only for owner convenience

ALTER TABLE galleries 
ADD COLUMN IF NOT EXISTS password_plain text;

-- Add comment explaining the column
COMMENT ON COLUMN galleries.password_plain IS 'Plain text password for owner display. Hash is still used for validation.';
