-- ============================================
-- Migration 029: Company Name Change Tracking
-- Tracks name changes with a limit of 2 per year per user
-- ============================================

-- Create table to track name changes
CREATE TABLE IF NOT EXISTS public.name_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    old_name TEXT,
    new_name TEXT NOT NULL,
    old_slug TEXT,
    new_slug TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())
);

-- Index for efficient lookups by user and year
CREATE INDEX IF NOT EXISTS idx_name_change_history_user_year 
    ON public.name_change_history(user_id, year);

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_name_change_history_changed_at 
    ON public.name_change_history(changed_at DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to count name changes for a user in current year
CREATE OR REPLACE FUNCTION public.get_name_changes_this_year(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.name_change_history
    WHERE user_id = p_user_id
    AND year = EXTRACT(YEAR FROM NOW());
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get remaining name changes for a user
CREATE OR REPLACE FUNCTION public.get_remaining_name_changes(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_used INTEGER;
    v_max_changes INTEGER := 2;
BEGIN
    v_used := public.get_name_changes_this_year(p_user_id);
    RETURN GREATEST(0, v_max_changes - v_used);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to record a name change (returns success/error)
CREATE OR REPLACE FUNCTION public.record_name_change(
    p_user_id UUID,
    p_old_name TEXT,
    p_new_name TEXT,
    p_old_slug TEXT DEFAULT NULL,
    p_new_slug TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_remaining INTEGER;
BEGIN
    -- Check if user has remaining changes
    v_remaining := public.get_remaining_name_changes(p_user_id);
    
    IF v_remaining <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Record the change
    INSERT INTO public.name_change_history (
        user_id, 
        old_name, 
        new_name, 
        old_slug, 
        new_slug,
        year
    ) VALUES (
        p_user_id,
        p_old_name,
        p_new_name,
        p_old_slug,
        p_new_slug,
        EXTRACT(YEAR FROM NOW())::INTEGER
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on name_change_history
ALTER TABLE public.name_change_history ENABLE ROW LEVEL SECURITY;

-- Service role can manage all records
CREATE POLICY "name_change_history_service_all"
    ON public.name_change_history
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- ROLLBACK SCRIPT (run separately if needed)
-- ============================================
/*
DROP TABLE IF EXISTS public.name_change_history;
DROP FUNCTION IF EXISTS public.get_name_changes_this_year(UUID);
DROP FUNCTION IF EXISTS public.get_remaining_name_changes(UUID);
DROP FUNCTION IF EXISTS public.record_name_change(UUID, TEXT, TEXT, TEXT, TEXT);
*/
