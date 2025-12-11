-- ============================================================================
-- SUBSCRIPTION GRACE PERIOD & GALLERY ARCHIVING
-- ============================================================================
-- Adds fields to track:
-- 1. Payment failure status and grace period
-- 2. Gallery archiving for downgraded users
-- ============================================================================

-- Add subscription status tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_failure_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS downgraded_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_plan TEXT;

-- Add archived_at to galleries table for soft-archiving
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS archived_reason TEXT;

-- Create index for querying archived galleries
CREATE INDEX IF NOT EXISTS idx_galleries_archived_at ON galleries(archived_at) WHERE archived_at IS NOT NULL;

-- Create index for users in grace period (for cron jobs)
CREATE INDEX IF NOT EXISTS idx_users_grace_period ON users(grace_period_ends_at) WHERE grace_period_ends_at IS NOT NULL;

-- Create index for users with payment failures
CREATE INDEX IF NOT EXISTS idx_users_payment_failed ON users(payment_failed_at) WHERE payment_failed_at IS NOT NULL;

-- Add constraint for subscription status
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_status_check 
  CHECK (subscription_status IN ('active', 'past_due', 'grace_period', 'canceled', 'paused'));

-- Add constraint for archived reason
ALTER TABLE galleries DROP CONSTRAINT IF EXISTS galleries_archived_reason_check;
ALTER TABLE galleries ADD CONSTRAINT galleries_archived_reason_check 
  CHECK (archived_reason IS NULL OR archived_reason IN ('downgrade', 'payment_failed', 'manual', 'expired'));

-- ============================================================================
-- SUBSCRIPTION EVENTS LOG
-- ============================================================================
-- Track all subscription lifecycle events for auditing

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  previous_plan TEXT,
  new_plan TEXT,
  stripe_event_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying user's subscription history
CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id, created_at DESC);

-- Add constraint for event types
ALTER TABLE subscription_events DROP CONSTRAINT IF EXISTS subscription_events_type_check;
ALTER TABLE subscription_events ADD CONSTRAINT subscription_events_type_check 
  CHECK (event_type IN (
    'subscription_created',
    'subscription_updated', 
    'subscription_canceled',
    'payment_failed',
    'payment_recovered',
    'grace_period_started',
    'grace_period_ended',
    'downgrade_initiated',
    'downgrade_completed',
    'galleries_archived',
    'galleries_restored'
  ));

-- RLS policies for subscription_events (admin only)
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_events_admin_all" ON subscription_events;
CREATE POLICY "subscription_events_admin_all" ON subscription_events
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- SCHEDULED DELETION QUEUE
-- ============================================================================
-- Track data scheduled for deletion after extended non-payment

CREATE TABLE IF NOT EXISTS scheduled_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deletion_type TEXT NOT NULL,
  target_id UUID,
  scheduled_for TIMESTAMPTZ NOT NULL,
  warning_sent_at TIMESTAMPTZ,
  final_warning_sent_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cron job to find pending deletions
CREATE INDEX IF NOT EXISTS idx_scheduled_deletions_pending 
  ON scheduled_deletions(scheduled_for) 
  WHERE executed_at IS NULL AND canceled_at IS NULL;

-- Add constraint for deletion types
ALTER TABLE scheduled_deletions DROP CONSTRAINT IF EXISTS scheduled_deletions_type_check;
ALTER TABLE scheduled_deletions ADD CONSTRAINT scheduled_deletions_type_check 
  CHECK (deletion_type IN ('gallery_data', 'user_storage', 'cold_storage_migration'));

-- RLS policies
ALTER TABLE scheduled_deletions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scheduled_deletions_admin_all" ON scheduled_deletions;
CREATE POLICY "scheduled_deletions_admin_all" ON scheduled_deletions
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- HELPER FUNCTION: Archive galleries for downgraded user
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_excess_galleries(
  p_user_id UUID,
  p_gallery_ids_to_keep UUID[],
  p_reason TEXT DEFAULT 'downgrade'
) RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE galleries
  SET 
    archived_at = NOW(),
    archived_reason = p_reason
  WHERE 
    user_id = p_user_id
    AND archived_at IS NULL
    AND id != ALL(p_gallery_ids_to_keep);
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Restore archived galleries
-- ============================================================================

CREATE OR REPLACE FUNCTION restore_archived_galleries(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  restored_count INTEGER;
BEGIN
  UPDATE galleries
  SET 
    archived_at = NULL,
    archived_reason = NULL
  WHERE 
    user_id = p_user_id
    AND archived_at IS NOT NULL;
  
  GET DIAGNOSTICS restored_count = ROW_COUNT;
  RETURN restored_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE subscription_events IS 'Audit log for all subscription lifecycle events';
COMMENT ON TABLE scheduled_deletions IS 'Queue for data scheduled for deletion after extended non-payment';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status: active, past_due, grace_period, canceled, paused';
COMMENT ON COLUMN users.grace_period_ends_at IS 'When the grace period ends and account will be downgraded';
COMMENT ON COLUMN galleries.archived_at IS 'When gallery was archived (null = active)';
COMMENT ON COLUMN galleries.archived_reason IS 'Why gallery was archived: downgrade, payment_failed, manual, expired';
