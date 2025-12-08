-- ============================================
-- Migration 024: Email Tracking System
-- ============================================
-- Comprehensive email tracking like Pixieset:
-- - Log all sent emails
-- - Track opens (pixel tracking)
-- - Track clicks (link redirects)
-- - Track downloads linked to emails
-- ============================================

-- --------------------------------------------
-- email_logs
-- Master log of all emails sent
-- --------------------------------------------
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who sent it
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- What gallery (optional - some emails may be system-level)
    gallery_id UUID REFERENCES public.galleries(id) ON DELETE SET NULL,
    
    -- Email details
    email_type TEXT NOT NULL, -- 'gallery_invite', 'archive_ready', 'reminder', etc.
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    
    -- Resend tracking
    resend_message_id TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'failed'
    error_message TEXT,
    
    -- Tracking stats
    opened_at TIMESTAMPTZ,
    opened_count INTEGER NOT NULL DEFAULT 0,
    last_opened_at TIMESTAMPTZ,
    
    clicked_at TIMESTAMPTZ,
    clicked_count INTEGER NOT NULL DEFAULT 0,
    last_clicked_at TIMESTAMPTZ,
    
    -- Download tracking (for archive emails)
    downloaded_at TIMESTAMPTZ,
    download_count INTEGER NOT NULL DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT email_logs_type_check CHECK (
        email_type IN ('gallery_invite', 'archive_ready', 'reminder', 'welcome', 'other')
    ),
    CONSTRAINT email_logs_status_check CHECK (
        status IN ('pending', 'sent', 'delivered', 'opened', 'bounced', 'failed')
    ),
    CONSTRAINT email_logs_email_format CHECK (
        recipient_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Indexes for common queries
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_gallery_id ON public.email_logs(gallery_id);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX idx_email_logs_resend_id ON public.email_logs(resend_message_id);

-- --------------------------------------------
-- email_events
-- Granular event log for webhooks/tracking
-- --------------------------------------------
CREATE TABLE public.email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_log_id UUID NOT NULL REFERENCES public.email_logs(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'downloaded'
    
    -- Event metadata
    ip_address TEXT,
    user_agent TEXT,
    link_url TEXT, -- For click events
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT email_events_type_check CHECK (
        event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'downloaded', 'failed')
    )
);

CREATE INDEX idx_email_events_log_id ON public.email_events(email_log_id);
CREATE INDEX idx_email_events_type ON public.email_events(event_type);

-- --------------------------------------------
-- Update trigger for email_logs
-- --------------------------------------------
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_logs_updated_at
    BEFORE UPDATE ON public.email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_email_logs_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Email logs: Users can only see their own emails
CREATE POLICY "email_logs_select_own"
    ON public.email_logs
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "email_logs_insert_own"
    ON public.email_logs
    FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.uid()::text
        )
    );

-- Email events: Users can see events for their emails
CREATE POLICY "email_events_select_own"
    ON public.email_events
    FOR SELECT
    USING (
        email_log_id IN (
            SELECT el.id FROM public.email_logs el
            JOIN public.users u ON el.user_id = u.id
            WHERE u.clerk_id = auth.uid()::text
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to record an email open
CREATE OR REPLACE FUNCTION record_email_open(
    p_email_log_id UUID,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update the email log
    UPDATE public.email_logs
    SET 
        opened_count = opened_count + 1,
        opened_at = COALESCE(opened_at, NOW()),
        last_opened_at = NOW(),
        status = CASE WHEN status = 'sent' OR status = 'delivered' THEN 'opened' ELSE status END
    WHERE id = p_email_log_id;
    
    -- Insert event
    INSERT INTO public.email_events (email_log_id, event_type, ip_address, user_agent)
    VALUES (p_email_log_id, 'opened', p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a link click
CREATE OR REPLACE FUNCTION record_email_click(
    p_email_log_id UUID,
    p_link_url TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update the email log
    UPDATE public.email_logs
    SET 
        clicked_count = clicked_count + 1,
        clicked_at = COALESCE(clicked_at, NOW()),
        last_clicked_at = NOW()
    WHERE id = p_email_log_id;
    
    -- Insert event
    INSERT INTO public.email_events (email_log_id, event_type, link_url, ip_address, user_agent)
    VALUES (p_email_log_id, 'clicked', p_link_url, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a download
CREATE OR REPLACE FUNCTION record_email_download(
    p_email_log_id UUID,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update the email log
    UPDATE public.email_logs
    SET 
        download_count = download_count + 1,
        downloaded_at = COALESCE(downloaded_at, NOW()),
        last_downloaded_at = NOW()
    WHERE id = p_email_log_id;
    
    -- Insert event
    INSERT INTO public.email_events (email_log_id, event_type, ip_address, user_agent)
    VALUES (p_email_log_id, 'downloaded', p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS FOR EASY QUERYING
-- ============================================

-- Gallery email summary view
CREATE OR REPLACE VIEW public.gallery_email_summary AS
SELECT 
    el.gallery_id,
    COUNT(*) as total_emails,
    COUNT(DISTINCT el.recipient_email) as unique_recipients,
    SUM(el.opened_count) as total_opens,
    COUNT(CASE WHEN el.opened_at IS NOT NULL THEN 1 END) as emails_opened,
    SUM(el.clicked_count) as total_clicks,
    COUNT(CASE WHEN el.clicked_at IS NOT NULL THEN 1 END) as emails_clicked,
    SUM(el.download_count) as total_downloads,
    COUNT(CASE WHEN el.downloaded_at IS NOT NULL THEN 1 END) as emails_with_downloads,
    MAX(el.created_at) as last_email_sent
FROM public.email_logs el
WHERE el.gallery_id IS NOT NULL
GROUP BY el.gallery_id;

COMMENT ON TABLE public.email_logs IS 'Tracks all emails sent from the platform with open/click/download analytics';
COMMENT ON TABLE public.email_events IS 'Granular event log for email interactions';
