-- Migration: Feature Flags System
-- Date: 2024-12-09
-- Purpose: God-mode feature flag control with targeting and rollouts

-- ============================================================================
-- FEATURE FLAGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  key TEXT UNIQUE NOT NULL, -- e.g., 'new_gallery_viewer', 'turbo_upload'
  name TEXT NOT NULL, -- Human readable name
  description TEXT,
  
  -- State
  is_enabled BOOLEAN DEFAULT false, -- Master switch
  
  -- Targeting Type
  flag_type TEXT NOT NULL DEFAULT 'boolean', -- 'boolean', 'percentage', 'user_list', 'plan_based', 'date_range'
  
  -- Percentage Rollout (for flag_type = 'percentage')
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  
  -- Plan Targeting (for flag_type = 'plan_based')
  target_plans TEXT[] DEFAULT '{}', -- ['pro', 'studio', 'elite']
  
  -- User Targeting (for flag_type = 'user_list')
  target_user_ids UUID[] DEFAULT '{}',
  target_user_emails TEXT[] DEFAULT '{}',
  
  -- Date Range (for flag_type = 'date_range')
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  -- Metadata
  category TEXT DEFAULT 'general', -- 'general', 'ui', 'billing', 'experimental'
  is_killswitch BOOLEAN DEFAULT false, -- If true, disabling kills the feature immediately
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);

-- ============================================================================
-- FLAG EVALUATION HISTORY (for analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flag_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  result BOOLEAN NOT NULL, -- Was the flag enabled for this user?
  evaluation_reason TEXT, -- 'master_disabled', 'percentage_miss', 'plan_match', etc.
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_flag_evaluations_flag ON feature_flag_evaluations(flag_id);
CREATE INDEX IF NOT EXISTS idx_flag_evaluations_user ON feature_flag_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_flag_evaluations_date ON feature_flag_evaluations(evaluated_at);

-- Partition by month for performance (optional, for high-volume)
-- CREATE INDEX IF NOT EXISTS idx_flag_evaluations_month ON feature_flag_evaluations(DATE_TRUNC('month', evaluated_at));

-- ============================================================================
-- FLAG CHANGE HISTORY (audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flag_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  change_type TEXT NOT NULL, -- 'created', 'enabled', 'disabled', 'updated', 'deleted'
  old_value JSONB,
  new_value JSONB,
  reason TEXT, -- Optional reason for the change
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flag_history_flag ON feature_flag_history(flag_id);
CREATE INDEX IF NOT EXISTS idx_flag_history_date ON feature_flag_history(changed_at);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if a flag is enabled for a specific user
CREATE OR REPLACE FUNCTION evaluate_feature_flag(
  p_flag_key TEXT,
  p_user_id UUID DEFAULT NULL,
  p_user_plan TEXT DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
  result BOOLEAN := false;
  reason TEXT := 'not_found';
  hash_value INTEGER;
BEGIN
  -- Get the flag
  SELECT * INTO flag_record FROM feature_flags WHERE key = p_flag_key;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check master switch
  IF NOT flag_record.is_enabled THEN
    reason := 'master_disabled';
    result := false;
  
  -- Check date range
  ELSIF flag_record.flag_type = 'date_range' THEN
    IF flag_record.starts_at IS NOT NULL AND NOW() < flag_record.starts_at THEN
      reason := 'before_start_date';
      result := false;
    ELSIF flag_record.ends_at IS NOT NULL AND NOW() > flag_record.ends_at THEN
      reason := 'after_end_date';
      result := false;
    ELSE
      reason := 'date_range_match';
      result := true;
    END IF;
  
  -- Check percentage rollout
  ELSIF flag_record.flag_type = 'percentage' THEN
    IF p_user_id IS NOT NULL THEN
      -- Use user ID to generate consistent hash
      hash_value := ABS(HASHTEXT(p_user_id::TEXT || p_flag_key)) % 100;
      IF hash_value < flag_record.rollout_percentage THEN
        reason := 'percentage_match';
        result := true;
      ELSE
        reason := 'percentage_miss';
        result := false;
      END IF;
    ELSE
      -- No user, use random
      IF RANDOM() * 100 < flag_record.rollout_percentage THEN
        reason := 'percentage_random_match';
        result := true;
      ELSE
        reason := 'percentage_random_miss';
        result := false;
      END IF;
    END IF;
  
  -- Check plan-based targeting
  ELSIF flag_record.flag_type = 'plan_based' THEN
    IF p_user_plan IS NOT NULL AND p_user_plan = ANY(flag_record.target_plans) THEN
      reason := 'plan_match';
      result := true;
    ELSE
      reason := 'plan_miss';
      result := false;
    END IF;
  
  -- Check user list targeting
  ELSIF flag_record.flag_type = 'user_list' THEN
    IF p_user_id IS NOT NULL AND p_user_id = ANY(flag_record.target_user_ids) THEN
      reason := 'user_id_match';
      result := true;
    ELSIF p_user_email IS NOT NULL AND p_user_email = ANY(flag_record.target_user_emails) THEN
      reason := 'user_email_match';
      result := true;
    ELSE
      reason := 'user_list_miss';
      result := false;
    END IF;
  
  -- Boolean flag (simple on/off)
  ELSE
    reason := 'boolean_enabled';
    result := true;
  END IF;
  
  -- Log evaluation (optional - can be disabled for performance)
  -- INSERT INTO feature_flag_evaluations (flag_id, user_id, result, evaluation_reason)
  -- VALUES (flag_record.id, p_user_id, result, reason);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all flags with their current state
CREATE OR REPLACE FUNCTION get_all_feature_flags()
RETURNS TABLE (
  id UUID,
  key TEXT,
  name TEXT,
  description TEXT,
  is_enabled BOOLEAN,
  flag_type TEXT,
  rollout_percentage INTEGER,
  target_plans TEXT[],
  target_user_count INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  category TEXT,
  is_killswitch BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ff.id,
    ff.key,
    ff.name,
    ff.description,
    ff.is_enabled,
    ff.flag_type,
    ff.rollout_percentage,
    ff.target_plans,
    COALESCE(array_length(ff.target_user_ids, 1), 0) + COALESCE(array_length(ff.target_user_emails, 1), 0) as target_user_count,
    ff.starts_at,
    ff.ends_at,
    ff.category,
    ff.is_killswitch,
    ff.created_at,
    ff.updated_at
  FROM feature_flags ff
  ORDER BY ff.category, ff.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle a flag on/off
CREATE OR REPLACE FUNCTION toggle_feature_flag(
  p_flag_key TEXT,
  p_enabled BOOLEAN,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
BEGIN
  -- Get current state
  SELECT * INTO flag_record FROM feature_flags WHERE key = p_flag_key;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Flag not found: %', p_flag_key;
  END IF;
  
  -- Update flag
  UPDATE feature_flags 
  SET is_enabled = p_enabled, updated_at = NOW(), updated_by = p_admin_id
  WHERE key = p_flag_key;
  
  -- Log change
  INSERT INTO feature_flag_history (flag_id, changed_by, change_type, old_value, new_value, reason)
  VALUES (
    flag_record.id,
    p_admin_id,
    CASE WHEN p_enabled THEN 'enabled' ELSE 'disabled' END,
    jsonb_build_object('is_enabled', flag_record.is_enabled),
    jsonb_build_object('is_enabled', p_enabled),
    p_reason
  );
  
  -- Log to admin audit
  INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, target_identifier, metadata)
  VALUES (
    p_admin_id,
    'system.feature_flag_update',
    'feature_flag',
    flag_record.id,
    p_flag_key,
    jsonb_build_object(
      'action', CASE WHEN p_enabled THEN 'enabled' ELSE 'disabled' END,
      'flag_name', flag_record.name,
      'reason', p_reason
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new flag
CREATE OR REPLACE FUNCTION create_feature_flag(
  p_key TEXT,
  p_name TEXT,
  p_description TEXT,
  p_flag_type TEXT,
  p_category TEXT,
  p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO feature_flags (key, name, description, flag_type, category, created_by)
  VALUES (p_key, p_name, p_description, p_flag_type, p_category, p_admin_id)
  RETURNING id INTO new_id;
  
  -- Log creation
  INSERT INTO feature_flag_history (flag_id, changed_by, change_type, new_value)
  VALUES (
    new_id,
    p_admin_id,
    'created',
    jsonb_build_object('key', p_key, 'name', p_name, 'type', p_flag_type)
  );
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update flag configuration
CREATE OR REPLACE FUNCTION update_feature_flag(
  p_flag_id UUID,
  p_updates JSONB,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
  old_values JSONB;
BEGIN
  -- Get current state
  SELECT * INTO flag_record FROM feature_flags WHERE id = p_flag_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Flag not found';
  END IF;
  
  -- Store old values
  old_values := to_jsonb(flag_record);
  
  -- Update fields from p_updates
  UPDATE feature_flags SET
    name = COALESCE(p_updates->>'name', name),
    description = COALESCE(p_updates->>'description', description),
    flag_type = COALESCE(p_updates->>'flag_type', flag_type),
    rollout_percentage = COALESCE((p_updates->>'rollout_percentage')::INTEGER, rollout_percentage),
    target_plans = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p_updates->'target_plans')),
      target_plans
    ),
    starts_at = CASE 
      WHEN p_updates ? 'starts_at' THEN (p_updates->>'starts_at')::TIMESTAMPTZ 
      ELSE starts_at 
    END,
    ends_at = CASE 
      WHEN p_updates ? 'ends_at' THEN (p_updates->>'ends_at')::TIMESTAMPTZ 
      ELSE ends_at 
    END,
    category = COALESCE(p_updates->>'category', category),
    is_killswitch = COALESCE((p_updates->>'is_killswitch')::BOOLEAN, is_killswitch),
    updated_at = NOW(),
    updated_by = p_admin_id
  WHERE id = p_flag_id;
  
  -- Log change
  INSERT INTO feature_flag_history (flag_id, changed_by, change_type, old_value, new_value, reason)
  VALUES (p_flag_id, p_admin_id, 'updated', old_values, p_updates, p_reason);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete a flag
CREATE OR REPLACE FUNCTION delete_feature_flag(
  p_flag_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
BEGIN
  SELECT * INTO flag_record FROM feature_flags WHERE id = p_flag_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Flag not found';
  END IF;
  
  -- Log deletion before removing
  INSERT INTO feature_flag_history (flag_id, changed_by, change_type, old_value, reason)
  VALUES (
    p_flag_id,
    p_admin_id,
    'deleted',
    to_jsonb(flag_record),
    p_reason
  );
  
  -- Delete flag
  DELETE FROM feature_flags WHERE id = p_flag_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DEFAULT FLAGS
-- ============================================================================

-- Insert some default feature flags
INSERT INTO feature_flags (key, name, description, flag_type, category, is_enabled) VALUES
  ('turbo_upload', 'Turbo Upload Mode', 'Client-side compression for faster uploads', 'boolean', 'ui', true),
  ('editorial_view', 'Editorial Gallery View', 'Magazine-style gallery viewing experience', 'boolean', 'ui', true),
  ('pinterest_sharing', 'Pinterest Sharing', 'Allow users to share images to Pinterest', 'boolean', 'ui', true),
  ('client_portal', 'Client Portal', 'Enable client portal features', 'plan_based', 'billing', true),
  ('contracts', 'Smart Contracts', 'Enable contract generation and signing', 'plan_based', 'billing', true),
  ('community_spotlight', 'Community Spotlight', 'Enable contest and voting features', 'boolean', 'general', true),
  ('new_onboarding', 'New Onboarding Flow', 'Experimental new user onboarding', 'percentage', 'experimental', false),
  ('maintenance_banner', 'Maintenance Banner', 'Show maintenance warning to users', 'boolean', 'general', false)
ON CONFLICT (key) DO NOTHING;

-- Set plan targeting for plan-based flags
UPDATE feature_flags SET target_plans = ARRAY['essential', 'pro', 'studio', 'elite'] WHERE key = 'client_portal';
UPDATE feature_flags SET target_plans = ARRAY['pro', 'studio', 'elite'] WHERE key = 'contracts';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE feature_flags IS 'Feature flag definitions with targeting rules';
COMMENT ON TABLE feature_flag_evaluations IS 'Log of flag evaluations for analytics';
COMMENT ON TABLE feature_flag_history IS 'Audit trail of flag changes';
COMMENT ON FUNCTION evaluate_feature_flag IS 'Evaluate if a flag is enabled for a user';
COMMENT ON FUNCTION toggle_feature_flag IS 'Enable or disable a flag with audit logging';
