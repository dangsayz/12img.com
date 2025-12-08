-- ============================================
-- Migration 041: Delivery Milestones & Progress Tracking
-- ============================================
-- Implements milestone-based delivery tracking with:
-- - Milestone timeline engine
-- - Delivery countdown timer
-- - Contract workflow state machine
-- - Centralized communication layer
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
-- 2. MILESTONES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  
  -- Milestone data
  type TEXT NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  
  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  
  -- Metadata
  is_system_generated BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for milestones
CREATE INDEX IF NOT EXISTS idx_milestones_contract ON public.milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_milestones_photographer ON public.milestones(photographer_id);
CREATE INDEX IF NOT EXISTS idx_milestones_client ON public.milestones(client_id);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON public.milestones(type);
CREATE INDEX IF NOT EXISTS idx_milestones_occurred_at ON public.milestones(occurred_at DESC);

-- ============================================
-- 3. DELIVERY PROGRESS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.delivery_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL UNIQUE REFERENCES public.contracts(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  
  -- Delivery window configuration
  delivery_window_days INTEGER NOT NULL DEFAULT 60,
  
  -- Timeline tracking
  event_completed_at TIMESTAMPTZ,
  estimated_delivery_date DATE,
  
  -- Progress metrics (updated by trigger/cron)
  days_remaining INTEGER,
  days_elapsed INTEGER DEFAULT 0,
  percent_complete NUMERIC(5,2) DEFAULT 0,
  
  -- Status flags
  is_overdue BOOLEAN DEFAULT FALSE,
  delivery_status TEXT NOT NULL DEFAULT 'pending_event'
    CHECK (delivery_status IN ('pending_event', 'in_progress', 'overdue', 'delivered')),
  
  -- Completion
  delivered_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for delivery_progress
CREATE INDEX IF NOT EXISTS idx_delivery_progress_contract ON public.delivery_progress(contract_id);
CREATE INDEX IF NOT EXISTS idx_delivery_progress_photographer ON public.delivery_progress(photographer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_progress_status ON public.delivery_progress(delivery_status);
CREATE INDEX IF NOT EXISTS idx_delivery_progress_overdue ON public.delivery_progress(is_overdue) WHERE is_overdue = TRUE;

-- ============================================
-- 4. CONTRACT STATUS HISTORY (Audit Log)
-- ============================================

CREATE TABLE IF NOT EXISTS public.contract_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- Status transition
  previous_status TEXT,
  new_status TEXT NOT NULL,
  
  -- Actor
  changed_by UUID REFERENCES public.users(id),
  changed_by_type TEXT NOT NULL DEFAULT 'photographer'
    CHECK (changed_by_type IN ('photographer', 'client', 'system')),
  
  -- Context
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for status history
CREATE INDEX IF NOT EXISTS idx_contract_status_history_contract ON public.contract_status_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_status_history_created ON public.contract_status_history(created_at DESC);

-- ============================================
-- 5. EXTEND CONTRACTS TABLE
-- ============================================

-- Add delivery tracking columns to contracts if they don't exist
DO $$ BEGIN
  ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS delivery_window_days INTEGER DEFAULT 60;
  ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS event_completed_at TIMESTAMPTZ;
  ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- 6. SYSTEM MESSAGES FOR MILESTONES
-- ============================================

-- Add is_system_message column to messages if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS system_message_type TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to calculate delivery progress
CREATE OR REPLACE FUNCTION calculate_delivery_progress(
  p_event_completed_at TIMESTAMPTZ,
  p_delivery_window_days INTEGER
)
RETURNS TABLE (
  days_elapsed INTEGER,
  days_remaining INTEGER,
  percent_complete NUMERIC(5,2),
  estimated_delivery_date DATE,
  is_overdue BOOLEAN,
  delivery_status TEXT
) AS $$
DECLARE
  v_days_elapsed INTEGER;
  v_days_remaining INTEGER;
  v_percent NUMERIC(5,2);
  v_estimated_date DATE;
  v_is_overdue BOOLEAN;
  v_status TEXT;
BEGIN
  IF p_event_completed_at IS NULL THEN
    -- Event not yet completed
    RETURN QUERY SELECT 
      0::INTEGER,
      p_delivery_window_days,
      0::NUMERIC(5,2),
      NULL::DATE,
      FALSE,
      'pending_event'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate days elapsed since event
  v_days_elapsed := GREATEST(0, EXTRACT(DAY FROM (NOW() - p_event_completed_at))::INTEGER);
  
  -- Calculate estimated delivery date
  v_estimated_date := (p_event_completed_at + (p_delivery_window_days || ' days')::INTERVAL)::DATE;
  
  -- Calculate days remaining
  v_days_remaining := GREATEST(0, v_estimated_date - CURRENT_DATE);
  
  -- Calculate percent complete (based on time elapsed)
  v_percent := LEAST(100, ROUND((v_days_elapsed::NUMERIC / NULLIF(p_delivery_window_days, 0)) * 100, 2));
  
  -- Check if overdue
  v_is_overdue := CURRENT_DATE > v_estimated_date;
  
  -- Determine status
  IF v_is_overdue THEN
    v_status := 'overdue';
  ELSE
    v_status := 'in_progress';
  END IF;
  
  RETURN QUERY SELECT 
    v_days_elapsed,
    v_days_remaining,
    v_percent,
    v_estimated_date,
    v_is_overdue,
    v_status;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update all delivery progress records (for cron job)
CREATE OR REPLACE FUNCTION update_all_delivery_progress()
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER := 0;
  v_record RECORD;
  v_progress RECORD;
BEGIN
  FOR v_record IN 
    SELECT dp.id, dp.event_completed_at, dp.delivery_window_days, dp.delivered_at
    FROM public.delivery_progress dp
    WHERE dp.delivery_status != 'delivered'
  LOOP
    -- Skip if already delivered
    IF v_record.delivered_at IS NOT NULL THEN
      UPDATE public.delivery_progress
      SET 
        delivery_status = 'delivered',
        percent_complete = 100,
        updated_at = NOW()
      WHERE id = v_record.id;
      v_updated := v_updated + 1;
      CONTINUE;
    END IF;
    
    -- Calculate progress
    SELECT * INTO v_progress 
    FROM calculate_delivery_progress(v_record.event_completed_at, v_record.delivery_window_days);
    
    -- Update record
    UPDATE public.delivery_progress
    SET 
      days_elapsed = v_progress.days_elapsed,
      days_remaining = v_progress.days_remaining,
      percent_complete = v_progress.percent_complete,
      estimated_delivery_date = v_progress.estimated_delivery_date,
      is_overdue = v_progress.is_overdue,
      delivery_status = v_progress.delivery_status,
      updated_at = NOW()
    WHERE id = v_record.id;
    
    v_updated := v_updated + 1;
  END LOOP;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to create milestone and system message
CREATE OR REPLACE FUNCTION create_milestone_with_notification(
  p_contract_id UUID,
  p_photographer_id UUID,
  p_client_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_is_system BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_milestone_id UUID;
  v_message_content TEXT;
BEGIN
  -- Create milestone
  INSERT INTO public.milestones (
    contract_id, photographer_id, client_id,
    type, title, description, notes,
    created_by, is_system_generated
  ) VALUES (
    p_contract_id, p_photographer_id, p_client_id,
    p_type, p_title, p_description, p_notes,
    p_created_by, p_is_system
  )
  RETURNING id INTO v_milestone_id;
  
  -- Create system message for the communication thread
  v_message_content := '📍 Milestone: ' || p_title;
  IF p_description IS NOT NULL THEN
    v_message_content := v_message_content || ' — ' || p_description;
  END IF;
  
  INSERT INTO public.messages (
    contract_id, sender_id, sender_type,
    content, is_system_message, system_message_type
  ) VALUES (
    p_contract_id, p_created_by, 'photographer',
    v_message_content, TRUE, 'milestone_' || p_type
  );
  
  RETURN v_milestone_id;
END;
$$ LANGUAGE plpgsql;

-- Function to start delivery countdown
CREATE OR REPLACE FUNCTION start_delivery_countdown(
  p_contract_id UUID,
  p_delivery_window_days INTEGER DEFAULT 60
)
RETURNS UUID AS $$
DECLARE
  v_contract RECORD;
  v_progress_id UUID;
  v_progress RECORD;
BEGIN
  -- Get contract details
  SELECT c.*, cp.id as client_profile_id
  INTO v_contract
  FROM public.contracts c
  JOIN public.client_profiles cp ON cp.id = c.client_id
  WHERE c.id = p_contract_id;
  
  IF v_contract IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  
  -- Calculate initial progress
  SELECT * INTO v_progress 
  FROM calculate_delivery_progress(NOW(), p_delivery_window_days);
  
  -- Create or update delivery progress
  INSERT INTO public.delivery_progress (
    contract_id, photographer_id, client_id,
    delivery_window_days, event_completed_at,
    days_elapsed, days_remaining, percent_complete,
    estimated_delivery_date, is_overdue, delivery_status
  ) VALUES (
    p_contract_id, v_contract.photographer_id, v_contract.client_profile_id,
    p_delivery_window_days, NOW(),
    v_progress.days_elapsed, v_progress.days_remaining, v_progress.percent_complete,
    v_progress.estimated_delivery_date, v_progress.is_overdue, v_progress.delivery_status
  )
  ON CONFLICT (contract_id) DO UPDATE SET
    delivery_window_days = p_delivery_window_days,
    event_completed_at = NOW(),
    days_elapsed = v_progress.days_elapsed,
    days_remaining = v_progress.days_remaining,
    percent_complete = v_progress.percent_complete,
    estimated_delivery_date = v_progress.estimated_delivery_date,
    is_overdue = v_progress.is_overdue,
    delivery_status = v_progress.delivery_status,
    updated_at = NOW()
  RETURNING id INTO v_progress_id;
  
  -- Update contract
  UPDATE public.contracts
  SET 
    event_completed_at = NOW(),
    delivery_window_days = p_delivery_window_days
  WHERE id = p_contract_id;
  
  RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark delivery complete
CREATE OR REPLACE FUNCTION mark_delivery_complete(p_contract_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update delivery progress
  UPDATE public.delivery_progress
  SET 
    delivery_status = 'delivered',
    delivered_at = NOW(),
    percent_complete = 100,
    days_remaining = 0,
    updated_at = NOW()
  WHERE contract_id = p_contract_id;
  
  -- Update contract
  UPDATE public.contracts
  SET delivered_at = NOW()
  WHERE id = p_contract_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Trigger to create delivery_progress when contract is created
CREATE OR REPLACE FUNCTION create_delivery_progress_on_contract()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.delivery_progress (
    contract_id, photographer_id, client_id,
    delivery_window_days, delivery_status
  ) VALUES (
    NEW.id, NEW.photographer_id, NEW.client_id,
    COALESCE(NEW.delivery_window_days, 60), 'pending_event'
  )
  ON CONFLICT (contract_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_delivery_progress ON public.contracts;
CREATE TRIGGER trigger_create_delivery_progress
  AFTER INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION create_delivery_progress_on_contract();

-- Trigger to log contract status changes
CREATE OR REPLACE FUNCTION log_contract_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.contract_status_history (
      contract_id, previous_status, new_status, changed_by_type
    ) VALUES (
      NEW.id, OLD.status, NEW.status, 'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_contract_status ON public.contracts;
CREATE TRIGGER trigger_log_contract_status
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION log_contract_status_change();

-- ============================================
-- 9. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_status_history ENABLE ROW LEVEL SECURITY;

-- Milestones policies
DROP POLICY IF EXISTS "Photographers can view own milestones" ON public.milestones;
CREATE POLICY "Photographers can view own milestones" ON public.milestones
  FOR SELECT USING (photographer_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

DROP POLICY IF EXISTS "Photographers can create milestones" ON public.milestones;
CREATE POLICY "Photographers can create milestones" ON public.milestones
  FOR INSERT WITH CHECK (photographer_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

DROP POLICY IF EXISTS "Photographers can update own milestones" ON public.milestones;
CREATE POLICY "Photographers can update own milestones" ON public.milestones
  FOR UPDATE USING (photographer_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

-- Delivery progress policies
DROP POLICY IF EXISTS "Photographers can view own delivery progress" ON public.delivery_progress;
CREATE POLICY "Photographers can view own delivery progress" ON public.delivery_progress
  FOR SELECT USING (photographer_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

DROP POLICY IF EXISTS "Photographers can update own delivery progress" ON public.delivery_progress;
CREATE POLICY "Photographers can update own delivery progress" ON public.delivery_progress
  FOR UPDATE USING (photographer_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

-- Contract status history policies
DROP POLICY IF EXISTS "Photographers can view own status history" ON public.contract_status_history;
CREATE POLICY "Photographers can view own status history" ON public.contract_status_history
  FOR SELECT USING (contract_id IN (
    SELECT id FROM public.contracts WHERE photographer_id IN (
      SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
    )
  ));

-- ============================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contracts_event_completed ON public.contracts(event_completed_at) 
  WHERE event_completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_delivered ON public.contracts(delivered_at) 
  WHERE delivered_at IS NOT NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
