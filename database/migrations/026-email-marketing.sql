-- ============================================
-- Migration 026: Email Marketing System
-- ============================================
-- Comprehensive email marketing for admins:
-- - Subscriber management
-- - Campaign tracking
-- - Broadcast emails
-- - Analytics
-- ============================================

-- --------------------------------------------
-- email_subscribers
-- All users who can receive marketing emails
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User reference (optional - can have non-user subscribers)
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Subscriber info
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    
    -- Subscription status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced', 'complained'
    
    -- Source tracking
    source TEXT DEFAULT 'signup', -- 'signup', 'import', 'manual', 'api'
    
    -- Preferences
    preferences JSONB DEFAULT '{"marketing": true, "product_updates": true, "tips": true}',
    
    -- Engagement metrics
    emails_received INTEGER NOT NULL DEFAULT 0,
    emails_opened INTEGER NOT NULL DEFAULT 0,
    emails_clicked INTEGER NOT NULL DEFAULT 0,
    last_email_at TIMESTAMPTZ,
    last_opened_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    
    -- Unsubscribe tracking
    unsubscribed_at TIMESTAMPTZ,
    unsubscribe_reason TEXT,
    
    -- Tags for segmentation
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT email_subscribers_status_check CHECK (
        status IN ('active', 'unsubscribed', 'bounced', 'complained')
    ),
    CONSTRAINT email_subscribers_email_format CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON public.email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_status ON public.email_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_user_id ON public.email_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_tags ON public.email_subscribers USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_created_at ON public.email_subscribers(created_at DESC);

-- --------------------------------------------
-- email_campaigns
-- Marketing email campaigns
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campaign info
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    preview_text TEXT,
    
    -- Content
    html_content TEXT NOT NULL,
    text_content TEXT,
    
    -- Targeting
    segment_filter JSONB DEFAULT '{}', -- Filter criteria for recipients
    tags_filter TEXT[] DEFAULT '{}', -- Target specific tags
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'cancelled'
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Stats
    total_recipients INTEGER NOT NULL DEFAULT 0,
    total_sent INTEGER NOT NULL DEFAULT 0,
    total_delivered INTEGER NOT NULL DEFAULT 0,
    total_opened INTEGER NOT NULL DEFAULT 0,
    total_clicked INTEGER NOT NULL DEFAULT 0,
    total_bounced INTEGER NOT NULL DEFAULT 0,
    total_unsubscribed INTEGER NOT NULL DEFAULT 0,
    
    -- Creator
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT email_campaigns_status_check CHECK (
        status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')
    )
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON public.email_campaigns(created_at DESC);

-- --------------------------------------------
-- email_campaign_sends
-- Individual sends for a campaign
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_campaign_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES public.email_subscribers(id) ON DELETE CASCADE,
    
    -- Resend tracking
    resend_message_id TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
    error_message TEXT,
    
    -- Tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    opened_count INTEGER NOT NULL DEFAULT 0,
    clicked_at TIMESTAMPTZ,
    clicked_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT email_campaign_sends_status_check CHECK (
        status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')
    ),
    CONSTRAINT email_campaign_sends_unique UNIQUE (campaign_id, subscriber_id)
);

CREATE INDEX IF NOT EXISTS idx_email_campaign_sends_campaign ON public.email_campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_sends_subscriber ON public.email_campaign_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_sends_status ON public.email_campaign_sends(status);

-- --------------------------------------------
-- email_templates
-- Reusable email templates
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Content
    subject TEXT NOT NULL,
    preview_text TEXT,
    html_content TEXT NOT NULL,
    text_content TEXT,
    
    -- Template variables (for reference)
    variables JSONB DEFAULT '[]', -- [{name: 'first_name', default: 'there'}]
    
    -- Categorization
    category TEXT DEFAULT 'general', -- 'general', 'promotional', 'announcement', 'newsletter'
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Creator
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger for subscribers
CREATE OR REPLACE FUNCTION update_email_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_subscribers_updated_at ON public.email_subscribers;
CREATE TRIGGER trigger_email_subscribers_updated_at
    BEFORE UPDATE ON public.email_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_email_subscribers_updated_at();

-- Update timestamp trigger for campaigns
CREATE OR REPLACE FUNCTION update_email_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_campaigns_updated_at ON public.email_campaigns;
CREATE TRIGGER trigger_email_campaigns_updated_at
    BEFORE UPDATE ON public.email_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_email_campaigns_updated_at();

-- Update timestamp trigger for templates
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER trigger_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_email_templates_updated_at();

-- ============================================
-- SYNC FUNCTION
-- Auto-sync users to subscribers
-- ============================================

-- Function to sync a user to subscribers
CREATE OR REPLACE FUNCTION sync_user_to_subscriber()
RETURNS TRIGGER AS $$
BEGIN
    -- On new user, add to subscribers
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.email_subscribers (user_id, email, name, source)
        VALUES (NEW.id, NEW.email, NULL, 'signup')
        ON CONFLICT (email) DO UPDATE SET
            user_id = NEW.id,
            updated_at = NOW();
    END IF;
    
    -- On email update, update subscriber
    IF TG_OP = 'UPDATE' AND OLD.email != NEW.email THEN
        UPDATE public.email_subscribers
        SET email = NEW.email, updated_at = NOW()
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_user_to_subscriber ON public.users;
CREATE TRIGGER trigger_sync_user_to_subscriber
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_to_subscriber();

-- ============================================
-- INITIAL DATA SYNC
-- Sync existing users to subscribers
-- ============================================

INSERT INTO public.email_subscribers (user_id, email, source, created_at)
SELECT id, email, 'signup', created_at
FROM public.users
WHERE email IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    updated_at = NOW();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.email_subscribers IS 'Marketing email subscriber list with engagement tracking';
COMMENT ON TABLE public.email_campaigns IS 'Email marketing campaigns with analytics';
COMMENT ON TABLE public.email_campaign_sends IS 'Individual email sends for campaign tracking';
COMMENT ON TABLE public.email_templates IS 'Reusable email templates for campaigns';
