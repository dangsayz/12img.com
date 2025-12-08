-- ============================================
-- Migration 030: Email Tracking Bot Filter
-- ============================================
-- Reduces false positive email opens from bots/scanners
-- by ignoring opens within 10 seconds of sending
-- ============================================

-- Update the record_email_open function to filter early opens
CREATE OR REPLACE FUNCTION record_email_open(
    p_email_log_id UUID,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_email_created_at TIMESTAMPTZ;
    v_seconds_since_sent NUMERIC;
BEGIN
    -- Get when the email was sent
    SELECT created_at INTO v_email_created_at
    FROM public.email_logs
    WHERE id = p_email_log_id;
    
    -- If email not found, exit
    IF v_email_created_at IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate seconds since email was sent
    v_seconds_since_sent := EXTRACT(EPOCH FROM (NOW() - v_email_created_at));
    
    -- Ignore opens within 10 seconds of sending (likely bot/scanner)
    IF v_seconds_since_sent < 10 THEN
        -- Still log the event for debugging, but mark it as bot
        INSERT INTO public.email_events (email_log_id, event_type, ip_address, user_agent)
        VALUES (p_email_log_id, 'opened', p_ip_address, COALESCE(p_user_agent, '') || ' [FILTERED:TOO_FAST]');
        RETURN;
    END IF;
    
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

COMMENT ON FUNCTION record_email_open IS 'Records email open event, filtering out bot opens within 10 seconds of sending';
