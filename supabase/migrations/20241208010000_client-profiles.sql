-- ============================================
-- Migration 031: Client Profiles
-- ============================================
-- Core client management for photographers
-- Stores client information for contracts and messaging
-- ============================================

-- Create event type enum (if not exists)
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM (
        'wedding',
        'engagement',
        'portrait',
        'family',
        'newborn',
        'maternity',
        'corporate',
        'event',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create client profiles table
CREATE TABLE public.client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Contact Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Partner/Secondary Contact (for weddings)
    partner_first_name TEXT,
    partner_last_name TEXT,
    partner_email TEXT,
    partner_phone TEXT,
    
    -- Event Details
    event_type event_type NOT NULL DEFAULT 'other',
    event_date DATE,
    event_location TEXT,
    event_venue TEXT,
    
    -- Package & Pricing
    package_name TEXT,
    package_price NUMERIC(10, 2),
    package_hours INTEGER,
    package_description TEXT,
    
    -- Additional Notes
    notes TEXT,
    
    -- Status
    is_archived BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_partner_email CHECK (
        partner_email IS NULL OR 
        partner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Create indexes for performance
CREATE INDEX idx_client_profiles_photographer ON public.client_profiles(photographer_id);
CREATE INDEX idx_client_profiles_email ON public.client_profiles(email);
CREATE INDEX idx_client_profiles_event_date ON public.client_profiles(event_date);
CREATE INDEX idx_client_profiles_created ON public.client_profiles(created_at DESC);
CREATE INDEX idx_client_profiles_archived ON public.client_profiles(photographer_id, is_archived);

-- Create updated_at trigger
CREATE TRIGGER update_client_profiles_updated_at
    BEFORE UPDATE ON public.client_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Photographers can only see their own clients
CREATE POLICY "Photographers can view own clients"
    ON public.client_profiles
    FOR SELECT
    USING (photographer_id = auth.uid());

-- Photographers can create clients
CREATE POLICY "Photographers can create clients"
    ON public.client_profiles
    FOR INSERT
    WITH CHECK (photographer_id = auth.uid());

-- Photographers can update their own clients
CREATE POLICY "Photographers can update own clients"
    ON public.client_profiles
    FOR UPDATE
    USING (photographer_id = auth.uid())
    WITH CHECK (photographer_id = auth.uid());

-- Photographers can delete their own clients
CREATE POLICY "Photographers can delete own clients"
    ON public.client_profiles
    FOR DELETE
    USING (photographer_id = auth.uid());

-- ============================================
-- Helper Functions
-- ============================================

-- Get client full name
CREATE OR REPLACE FUNCTION get_client_full_name(p_client_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_partner_first TEXT;
BEGIN
    SELECT first_name, last_name, partner_first_name
    INTO v_first_name, v_last_name, v_partner_first
    FROM public.client_profiles
    WHERE id = p_client_id;
    
    IF v_partner_first IS NOT NULL THEN
        RETURN v_first_name || ' & ' || v_partner_first || ' ' || v_last_name;
    ELSE
        RETURN v_first_name || ' ' || v_last_name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get upcoming events for a photographer
CREATE OR REPLACE FUNCTION get_upcoming_events(p_photographer_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    client_id UUID,
    client_name TEXT,
    event_type event_type,
    event_date DATE,
    event_location TEXT,
    days_until INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        get_client_full_name(cp.id),
        cp.event_type,
        cp.event_date,
        cp.event_location,
        (cp.event_date - CURRENT_DATE)::INTEGER
    FROM public.client_profiles cp
    WHERE cp.photographer_id = p_photographer_id
      AND cp.event_date >= CURRENT_DATE
      AND cp.is_archived = false
    ORDER BY cp.event_date ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.client_profiles IS 'Client profiles for photographers - stores contact info, event details, and package information';
COMMENT ON COLUMN public.client_profiles.photographer_id IS 'The photographer who owns this client';
COMMENT ON COLUMN public.client_profiles.partner_first_name IS 'For weddings - the partner/spouse name';
COMMENT ON COLUMN public.client_profiles.package_hours IS 'Number of hours included in the package';
