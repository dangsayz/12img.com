-- ============================================
-- Migration 043: Support Conversation Archive
-- ============================================
-- Adds archive functionality to support conversations
-- for better inbox management at scale.
-- ============================================

-- Add archived_at column to track when conversations were archived
ALTER TABLE public.support_conversations 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Update status enum to include 'archived' if not already present
-- Note: This is a safe operation - if 'archived' already exists, it will be ignored
DO $$ 
BEGIN
  -- Check if 'archived' value exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'archived' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'support_status')
  ) THEN
    -- Add 'archived' to the enum
    ALTER TYPE support_status ADD VALUE IF NOT EXISTS 'archived';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- If support_status enum doesn't exist, the status column might be text
    -- In that case, no action needed as text columns accept any value
    NULL;
END $$;

-- Create index for efficient filtering by status
CREATE INDEX IF NOT EXISTS idx_support_conversations_status 
ON public.support_conversations(status);

-- Create index for archived_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_support_conversations_archived_at 
ON public.support_conversations(archived_at) 
WHERE archived_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.support_conversations.archived_at IS 'Timestamp when conversation was archived, NULL if not archived';
