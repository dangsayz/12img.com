-- ============================================
-- Migration: 039-milestone-system.sql
-- Description: Milestone Tracking System + Delivery Countdown
-- ============================================

-- ============================================
-- 1. MILESTONE TYPES ENUM
-- ============================================

DO $$ BEGIN
  CREATE TYPE milestone_type AS ENUM (
    'contract_initiated',
    'contract_signed',
    'event_completed',
    'editing_started',
    'editing_complete',
    'gallery_created',
    'gallery_published',
    'delivery_complete',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. EXTEND CONTRACTS TABLE
-- ============================================

-- Add delivery tracking fields to contracts
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS delivery_window_days INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS event_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS editing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS editing_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gallery_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gallery_published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add extended status options
-- Note: Existing status column may need to be updated
-- Current: 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'cancelled'
-- Extended: Add 'in_progress' | 'editing' | 'ready' | 'delivered' | 'archived'

COMMENT ON COLUMN contracts.delivery_window_days IS 'Number of days from event completion to expected delivery';
COMMENT ON COLUMN contracts.event_completed_at IS 'When the event (wedding, shoot, etc.) was completed';

-- ============================================
-- 3. MILESTONES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  
  -- Milestone details
  type milestone_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT, -- Internal vendor notes
  
  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- System tracking
  is_system_generated BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for milestones
CREATE INDEX IF NOT EXISTS idx_milestones_contract ON milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_milestones_photographer ON milestones(photographer_id);
CREATE INDEX IF NOT EXISTS idx_milestones_client ON milestones(client_id);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON milestones(type);
CREATE INDEX IF NOT EXISTS idx_milestones_occurred ON milestones(occurred_at DESC);

-- ============================================
-- 4. DELIVERY PROGRESS VIEW
-- ============================================

-- Create a view that computes delivery progress in real-time
CREATE OR REPLACE VIEW delivery_progress AS
SELECT 
  c.id AS contract_id,
  c.photographer_id,
  c.client_id,
  c.status,
  c.delivery_window_days,
  c.event_completed_at,
  
  -- Computed delivery date
  CASE 
    WHEN c.event_completed_at IS NOT NULL THEN
      (c.event_completed_at + (c.delivery_window_days || ' days')::INTERVAL)::DATE
    ELSE NULL
  END AS estimated_delivery_date,
  
  -- Days remaining (can be negative if overdue)
  CASE 
    WHEN c.event_completed_at IS NOT NULL THEN
      EXTRACT(DAY FROM (
        (c.event_completed_at + (c.delivery_window_days || ' days')::INTERVAL) - NOW()
      ))::INTEGER
    ELSE NULL
  END AS days_remaining,
  
  -- Days elapsed since event
  CASE 
    WHEN c.event_completed_at IS NOT NULL THEN
      EXTRACT(DAY FROM (NOW() - c.event_completed_at))::INTEGER
    ELSE 0
  END AS days_elapsed,
  
  -- Percent complete (0-100, can exceed 100 if overdue)
  CASE 
    WHEN c.event_completed_at IS NOT NULL AND c.delivery_window_days > 0 THEN
      LEAST(100, GREATEST(0, 
        ROUND(
          (EXTRACT(DAY FROM (NOW() - c.event_completed_at))::NUMERIC / c.delivery_window_days) * 100
        )
      ))::INTEGER
    ELSE 0
  END AS percent_complete,
  
  -- Is overdue?
  CASE 
    WHEN c.event_completed_at IS NOT NULL THEN
      NOW() > (c.event_completed_at + (c.delivery_window_days || ' days')::INTERVAL)
    ELSE FALSE
  END AS is_overdue,
  
  -- Delivery status
  CASE
    WHEN c.delivered_at IS NOT NULL THEN 'delivered'
    WHEN c.event_completed_at IS NULL THEN 'pending_event'
    WHEN NOW() > (c.event_completed_at + (c.delivery_window_days || ' days')::INTERVAL) THEN 'overdue'
    ELSE 'in_progress'
  END AS delivery_status,
  
  -- Timestamps
  c.delivered_at,
  c.created_at,
  c.updated_at

FROM contracts c
WHERE c.status NOT IN ('cancelled', 'draft');

-- ============================================
-- 5. CONTRACT STATUS HISTORY (AUDIT LOG)
-- ============================================

CREATE TABLE IF NOT EXISTS contract_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Status change
  from_status TEXT,
  to_status TEXT NOT NULL,
  
  -- Who made the change
  changed_by UUID REFERENCES users(id),
  changed_by_type TEXT CHECK (changed_by_type IN ('photographer', 'client', 'system')),
  
  -- Additional context
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_contract ON contract_status_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON contract_status_history(created_at DESC);

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to create a milestone and optionally a system message
CREATE OR REPLACE FUNCTION create_milestone_with_notification(
  p_contract_id UUID,
  p_type milestone_type,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  p_created_by UUID DEFAULT NULL,
  p_send_notification BOOLEAN DEFAULT TRUE
) RETURNS UUID AS $$
DECLARE
  v_milestone_id UUID;
  v_contract RECORD;
  v_system_message TEXT;
BEGIN
  -- Get contract info
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;
  
  IF v_contract IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  
  -- Create milestone
  INSERT INTO milestones (
    contract_id, photographer_id, client_id,
    type, title, description, notes,
    occurred_at, created_by, is_system_generated
  ) VALUES (
    p_contract_id, v_contract.photographer_id, v_contract.client_id,
    p_type, p_title, p_description, p_notes,
    p_occurred_at, p_created_by, p_created_by IS NULL
  ) RETURNING id INTO v_milestone_id;
  
  -- Create system message if notification enabled
  IF p_send_notification THEN
    v_system_message := '📍 Milestone: ' || p_title;
    IF p_description IS NOT NULL THEN
      v_system_message := v_system_message || ' — ' || p_description;
    END IF;
    
    INSERT INTO messages (
      client_id, photographer_id,
      is_from_photographer, message_type, content, status
    ) VALUES (
      v_contract.client_id, v_contract.photographer_id,
      TRUE, 'system', v_system_message, 'sent'
    );
  END IF;
  
  RETURN v_milestone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update contract status with validation
CREATE OR REPLACE FUNCTION update_contract_status(
  p_contract_id UUID,
  p_new_status TEXT,
  p_changed_by UUID DEFAULT NULL,
  p_changed_by_type TEXT DEFAULT 'photographer',
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_status TEXT;
  v_contract RECORD;
  v_valid_transition BOOLEAN := FALSE;
BEGIN
  -- Get current contract
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;
  
  IF v_contract IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  
  v_current_status := v_contract.status;
  
  -- Define valid transitions
  v_valid_transition := CASE
    -- From draft
    WHEN v_current_status = 'draft' AND p_new_status IN ('sent', 'cancelled') THEN TRUE
    -- From sent
    WHEN v_current_status = 'sent' AND p_new_status IN ('viewed', 'signed', 'cancelled') THEN TRUE
    -- From viewed
    WHEN v_current_status = 'viewed' AND p_new_status IN ('signed', 'cancelled') THEN TRUE
    -- From signed
    WHEN v_current_status = 'signed' AND p_new_status IN ('in_progress', 'completed', 'cancelled') THEN TRUE
    -- From in_progress
    WHEN v_current_status = 'in_progress' AND p_new_status IN ('editing', 'completed', 'cancelled') THEN TRUE
    -- From editing
    WHEN v_current_status = 'editing' AND p_new_status IN ('ready', 'completed', 'cancelled') THEN TRUE
    -- From ready
    WHEN v_current_status = 'ready' AND p_new_status IN ('delivered', 'cancelled') THEN TRUE
    -- From completed (legacy)
    WHEN v_current_status = 'completed' AND p_new_status IN ('delivered', 'archived') THEN TRUE
    -- From delivered
    WHEN v_current_status = 'delivered' AND p_new_status = 'archived' THEN TRUE
    ELSE FALSE
  END;
  
  IF NOT v_valid_transition THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', v_current_status, p_new_status;
  END IF;
  
  -- Update contract status
  UPDATE contracts 
  SET 
    status = p_new_status,
    updated_at = NOW(),
    -- Set timestamp fields based on new status
    delivered_at = CASE WHEN p_new_status = 'delivered' THEN NOW() ELSE delivered_at END,
    editing_started_at = CASE WHEN p_new_status = 'editing' THEN NOW() ELSE editing_started_at END,
    editing_completed_at = CASE WHEN p_new_status = 'ready' THEN NOW() ELSE editing_completed_at END
  WHERE id = p_contract_id;
  
  -- Record in history
  INSERT INTO contract_status_history (
    contract_id, from_status, to_status,
    changed_by, changed_by_type, reason
  ) VALUES (
    p_contract_id, v_current_status, p_new_status,
    p_changed_by, p_changed_by_type, p_reason
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark event as completed and start countdown
CREATE OR REPLACE FUNCTION mark_event_completed(
  p_contract_id UUID,
  p_completed_at TIMESTAMPTZ DEFAULT NOW(),
  p_delivery_window_days INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_contract RECORD;
BEGIN
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;
  
  IF v_contract IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  
  -- Update contract
  UPDATE contracts 
  SET 
    event_completed_at = p_completed_at,
    delivery_window_days = COALESCE(p_delivery_window_days, delivery_window_days, 60),
    updated_at = NOW()
  WHERE id = p_contract_id;
  
  -- Create milestone
  PERFORM create_milestone_with_notification(
    p_contract_id,
    'event_completed',
    'Event Completed',
    'The event has been completed. Editing will begin shortly.',
    NULL,
    p_completed_at,
    NULL,
    TRUE
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Photographers can see/manage their own milestones
CREATE POLICY milestones_photographer_select ON milestones
  FOR SELECT TO authenticated
  USING (photographer_id = auth.uid());

CREATE POLICY milestones_photographer_insert ON milestones
  FOR INSERT TO authenticated
  WITH CHECK (photographer_id = auth.uid());

CREATE POLICY milestones_photographer_update ON milestones
  FOR UPDATE TO authenticated
  USING (photographer_id = auth.uid());

-- Enable RLS on status history
ALTER TABLE contract_status_history ENABLE ROW LEVEL SECURITY;

-- Photographers can see their contract history
CREATE POLICY status_history_photographer_select ON contract_status_history
  FOR SELECT TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM contracts WHERE photographer_id = auth.uid()
    )
  );

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contracts_event_completed ON contracts(event_completed_at) 
  WHERE event_completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_delivery_status ON contracts(status, delivered_at) 
  WHERE status NOT IN ('cancelled', 'draft');

-- ============================================
-- 9. COMMENTS
-- ============================================

COMMENT ON TABLE milestones IS 'Tracks all milestones in the contract/delivery lifecycle';
COMMENT ON TABLE contract_status_history IS 'Audit log of all contract status changes';
COMMENT ON VIEW delivery_progress IS 'Real-time computed delivery countdown for active contracts';

COMMENT ON FUNCTION create_milestone_with_notification IS 'Creates a milestone and optionally sends a system message notification';
COMMENT ON FUNCTION update_contract_status IS 'Updates contract status with transition validation and audit logging';
COMMENT ON FUNCTION mark_event_completed IS 'Marks the event as completed and starts the delivery countdown';
