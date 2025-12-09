-- ═══════════════════════════════════════════════════════════════
-- Migration: Add linked user support to vendors
-- ═══════════════════════════════════════════════════════════════

-- Add columns for linking vendors to registered 12img users
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;

-- Index for finding vendors linked to a user
CREATE INDEX IF NOT EXISTS idx_vendors_linked_user_id ON vendors(linked_user_id) WHERE linked_user_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN vendors.linked_user_id IS 'If vendor is a registered 12img user, this links to their user record';
COMMENT ON COLUMN vendors.invite_sent_at IS 'When an invitation was sent to this vendor to join 12img';
