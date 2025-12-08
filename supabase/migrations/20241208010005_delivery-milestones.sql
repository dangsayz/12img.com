-- ============================================
-- Migration: Delivery Milestones & Progress Tracking
-- ============================================
-- Implements milestone-based delivery tracking with:
-- - Milestone timeline engine
-- - Delivery countdown timer
-- - Contract workflow state machine
-- ============================================

-- ============================================
-- 1. MILESTONES TABLE
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
-- 2. DELIVERY PROGRESS TABLE
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
-- 3. CONTRACT STATUS HISTORY (Audit Log)
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
-- 4. EXTEND CONTRACTS TABLE
-- ============================================

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS delivery_window_days INTEGER DEFAULT 60;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS event_completed_at TIMESTAMPTZ;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- ============================================
-- 5. EXTEND MESSAGES TABLE
-- ============================================

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS system_message_type TEXT;

-- ============================================
-- 6. HELPER FUNCTIONS
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
    RETURN QUERY SELECT 
      0::INTEGER,
      p_delivery_window_days,
      0::NUMERIC(5,2),
      NULL::DATE,
      FALSE,
      'pending_event'::TEXT;
    RETURN;
  END IF;
  
  v_days_elapsed := GREATEST(0, EXTRACT(DAY FROM (NOW() - p_event_completed_at))::INTEGER);
  v_estimated_date := (p_event_completed_at + (p_delivery_window_days || ' days')::INTERVAL)::DATE;
  v_days_remaining := GREATEST(0, v_estimated_date - CURRENT_DATE);
  v_percent := LEAST(100, ROUND((v_days_elapsed::NUMERIC / NULLIF(p_delivery_window_days, 0)) * 100, 2));
  v_is_overdue := CURRENT_DATE > v_estimated_date;
  
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
    
    SELECT * INTO v_progress 
    FROM calculate_delivery_progress(v_record.event_completed_at, v_record.delivery_window_days);
    
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

-- ============================================
-- 7. TRIGGERS
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
-- 8. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_status_history ENABLE ROW LEVEL SECURITY;

-- Milestones policies
CREATE POLICY "Photographers can view own milestones" ON public.milestones
  FOR SELECT USING (photographer_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

CREATE POLICY "Photographers can create milestones" ON public.milestones
  FOR INSERT WITH CHECK (photographer_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

CREATE POLICY "Photographers can update own milestones" ON public.milestones
  FOR UPDATE USING (photographer_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

-- Delivery progress policies
CREATE POLICY "Photographers can view own delivery progress" ON public.delivery_progress
  FOR SELECT USING (photographer_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

CREATE POLICY "Photographers can update own delivery progress" ON public.delivery_progress
  FOR UPDATE USING (photographer_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

-- Contract status history policies
CREATE POLICY "Photographers can view own status history" ON public.contract_status_history
  FOR SELECT USING (contract_id IN (
    SELECT id FROM public.contracts WHERE photographer_id IN (
      SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
    )
  ));

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contracts_event_completed ON public.contracts(event_completed_at) 
  WHERE event_completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_delivered ON public.contracts(delivered_at) 
  WHERE delivered_at IS NOT NULL;
