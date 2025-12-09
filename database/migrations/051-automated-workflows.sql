-- ============================================================================
-- AUTOMATED WORKFLOWS SYSTEM
-- Migration: 051-automated-workflows.sql
-- Purpose: Time-based email automation triggered by event date proximity
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. WORKFLOW TEMPLATES
-- Reusable email templates that photographers can customize
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Template metadata
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'custom',
    
    -- Email content
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    
    -- Default timing (can be overridden per-client)
    default_days_offset INTEGER NOT NULL,
    
    -- System templates (user_id = NULL) vs user-created
    is_system BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_templates_user ON workflow_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_system ON workflow_templates(is_system) WHERE is_system = TRUE;

-- -----------------------------------------------------------------------------
-- 2. SCHEDULED WORKFLOWS
-- Individual scheduled emails for specific clients
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES workflow_templates(id) ON DELETE SET NULL,
    
    -- Scheduling
    days_offset INTEGER NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending',
    status_reason TEXT,
    
    -- Email snapshot (frozen at schedule time)
    email_subject TEXT NOT NULL,
    email_body_html TEXT NOT NULL,
    email_body_text TEXT,
    
    -- Execution tracking
    sent_at TIMESTAMPTZ,
    email_log_id UUID REFERENCES email_logs(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for cron job efficiency
CREATE INDEX IF NOT EXISTS idx_scheduled_workflows_pending ON scheduled_workflows(scheduled_for, status) 
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_workflows_client ON scheduled_workflows(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workflows_user ON scheduled_workflows(user_id);

-- -----------------------------------------------------------------------------
-- 3. WORKFLOW EXECUTION LOG
-- Audit trail for debugging and analytics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_workflow_id UUID NOT NULL REFERENCES scheduled_workflows(id) ON DELETE CASCADE,
    
    -- Execution details
    action TEXT NOT NULL,
    details JSONB,
    
    -- Timestamp
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_execution_log_workflow ON workflow_execution_log(scheduled_workflow_id);

-- -----------------------------------------------------------------------------
-- 4. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Calculate scheduled_for date from event_date and days_offset
CREATE OR REPLACE FUNCTION calculate_workflow_schedule(
    p_event_date DATE,
    p_days_offset INTEGER
) RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN (p_event_date + (p_days_offset || ' days')::INTERVAL)::DATE + INTERVAL '9 hours';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get active workflow count for a user (for plan limits)
CREATE OR REPLACE FUNCTION get_active_workflow_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM scheduled_workflows
        WHERE user_id = p_user_id
        AND status = 'pending'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get custom template count for a user (for plan limits)
CREATE OR REPLACE FUNCTION get_custom_template_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM workflow_templates
        WHERE user_id = p_user_id
        AND is_system = FALSE
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Auto-update scheduled_for when event_date changes
CREATE OR REPLACE FUNCTION update_workflow_schedules_on_event_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.event_date IS DISTINCT FROM NEW.event_date AND NEW.event_date IS NOT NULL THEN
        UPDATE scheduled_workflows
        SET 
            scheduled_for = calculate_workflow_schedule(NEW.event_date, days_offset),
            updated_at = NOW()
        WHERE client_id = NEW.id
        AND status = 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_update_workflow_schedules ON client_profiles;
CREATE TRIGGER trigger_update_workflow_schedules
    AFTER UPDATE ON client_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_schedules_on_event_change();

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_log ENABLE ROW LEVEL SECURITY;

-- Templates: Users see their own + system templates
DROP POLICY IF EXISTS "Users can view own and system templates" ON workflow_templates;
CREATE POLICY "Users can view own and system templates"
    ON workflow_templates FOR SELECT
    USING (user_id = auth.uid() OR is_system = TRUE);

DROP POLICY IF EXISTS "Users can insert own templates" ON workflow_templates;
CREATE POLICY "Users can insert own templates"
    ON workflow_templates FOR INSERT
    WITH CHECK (user_id = auth.uid() AND is_system = FALSE);

DROP POLICY IF EXISTS "Users can update own templates" ON workflow_templates;
CREATE POLICY "Users can update own templates"
    ON workflow_templates FOR UPDATE
    USING (user_id = auth.uid() AND is_system = FALSE);

DROP POLICY IF EXISTS "Users can delete own templates" ON workflow_templates;
CREATE POLICY "Users can delete own templates"
    ON workflow_templates FOR DELETE
    USING (user_id = auth.uid() AND is_system = FALSE);

-- Scheduled workflows: Users manage their own
DROP POLICY IF EXISTS "Users can view own scheduled workflows" ON scheduled_workflows;
CREATE POLICY "Users can view own scheduled workflows"
    ON scheduled_workflows FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own scheduled workflows" ON scheduled_workflows;
CREATE POLICY "Users can insert own scheduled workflows"
    ON scheduled_workflows FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own scheduled workflows" ON scheduled_workflows;
CREATE POLICY "Users can update own scheduled workflows"
    ON scheduled_workflows FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own scheduled workflows" ON scheduled_workflows;
CREATE POLICY "Users can delete own scheduled workflows"
    ON scheduled_workflows FOR DELETE
    USING (user_id = auth.uid());

-- Execution log: Users view their workflow logs
DROP POLICY IF EXISTS "Users can view own execution logs" ON workflow_execution_log;
CREATE POLICY "Users can view own execution logs"
    ON workflow_execution_log FOR SELECT
    USING (
        scheduled_workflow_id IN (
            SELECT id FROM scheduled_workflows WHERE user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 6. SEED SYSTEM TEMPLATES
-- -----------------------------------------------------------------------------

-- What to Wear Guide (14 days before)
INSERT INTO workflow_templates (id, user_id, name, description, category, subject, body_html, body_text, default_days_offset, is_system)
VALUES (
    'a1b2c3d4-0001-4000-8000-000000000001',
    NULL,
    'What to Wear Guide',
    'Help clients choose the perfect outfits for their session',
    'pre_event',
    'Your Session Style Guide - {{days_until_event}} Days to Go!',
    E'<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <h1 style="font-size: 24px; font-weight: normal; margin-bottom: 24px;">Hi {{client_first_name}},</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">Your {{event_type}} session is coming up in <strong>{{days_until_event}} days</strong>! I wanted to share some styling tips to help you look and feel your best.</p>
    <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 16px;">General Tips</h2>
    <ul style="font-size: 16px; line-height: 1.8; color: #333;">
        <li>Choose solid colors or subtle patterns</li>
        <li>Coordinate but don''t match exactly</li>
        <li>Avoid large logos or busy prints</li>
        <li>Bring layers for variety</li>
        <li>Iron or steam your outfits the night before</li>
    </ul>
    <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 16px;">Color Palette Suggestions</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">Neutrals (cream, beige, gray), earth tones, and muted jewel tones photograph beautifully. Feel free to reply with outfit photos if you''d like my input!</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 32px;">Looking forward to seeing you on <strong>{{event_date_formatted}}</strong>!</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">Warmly,<br>{{photographer_name}}</p>
</div>',
    E'Hi {{client_first_name}},\n\nYour {{event_type}} session is coming up in {{days_until_event}} days! Here are some styling tips:\n\n- Choose solid colors or subtle patterns\n- Coordinate but don''t match exactly\n- Avoid large logos or busy prints\n- Bring layers for variety\n\nLooking forward to seeing you on {{event_date_formatted}}!\n\nWarmly,\n{{photographer_name}}',
    -14,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Planning Questionnaire (30 days before)
INSERT INTO workflow_templates (id, user_id, name, description, category, subject, body_html, body_text, default_days_offset, is_system)
VALUES (
    'a1b2c3d4-0002-4000-8000-000000000002',
    NULL,
    'Planning Questionnaire',
    'Gather important details and preferences before the event',
    'pre_event',
    'Let''s Plan Your {{event_type}} - Quick Questionnaire',
    E'<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <h1 style="font-size: 24px; font-weight: normal; margin-bottom: 24px;">Hi {{client_first_name}},</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">With your {{event_type}} coming up on <strong>{{event_date_formatted}}</strong>, I''d love to learn more about your vision so I can capture exactly what you''re hoping for.</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">Please take a few minutes to answer these questions:</p>
    <ol style="font-size: 16px; line-height: 2; color: #333; margin-top: 16px;">
        <li>What''s the overall mood or vibe you''re going for?</li>
        <li>Are there specific shots or moments that are must-haves?</li>
        <li>Any locations or backdrops you have in mind?</li>
        <li>Who will be there, and are there any group shots needed?</li>
        <li>Anything you''d like me to avoid or be aware of?</li>
    </ol>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">Just reply to this email with your answers, or we can hop on a quick call if you prefer.</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">Talk soon,<br>{{photographer_name}}</p>
</div>',
    E'Hi {{client_first_name}},\n\nWith your {{event_type}} coming up on {{event_date_formatted}}, I''d love to learn more about your vision.\n\nPlease answer these questions:\n\n1. What''s the overall mood or vibe you''re going for?\n2. Are there specific shots or moments that are must-haves?\n3. Any locations or backdrops you have in mind?\n4. Who will be there, and are there any group shots needed?\n5. Anything you''d like me to avoid or be aware of?\n\nJust reply to this email with your answers!\n\nTalk soon,\n{{photographer_name}}',
    -30,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Timeline Reminder (7 days before)
INSERT INTO workflow_templates (id, user_id, name, description, category, subject, body_html, body_text, default_days_offset, is_system)
VALUES (
    'a1b2c3d4-0003-4000-8000-000000000003',
    NULL,
    'Timeline Reminder',
    'Send final logistics and timeline one week before',
    'pre_event',
    'One Week Out - Your {{event_type}} Timeline',
    E'<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <h1 style="font-size: 24px; font-weight: normal; margin-bottom: 24px;">Hi {{client_first_name}},</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">We''re just <strong>one week away</strong> from your {{event_type}}! Here''s what you need to know:</p>
    <div style="background: #f9f9f9; padding: 24px; margin: 24px 0; border-left: 3px solid #333;">
        <p style="margin: 0; font-size: 16px;"><strong>Date:</strong> {{event_date_formatted}}</p>
        <p style="margin: 8px 0 0 0; font-size: 16px;"><strong>Arrival Time:</strong> {{event_time_formatted}}</p>
        <p style="margin: 8px 0 0 0; font-size: 16px;"><strong>Location:</strong> {{event_location}}</p>
    </div>
    <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 16px;">Day-Of Checklist</h2>
    <ul style="font-size: 16px; line-height: 1.8; color: #333;">
        <li>Arrive 10-15 minutes early</li>
        <li>Bring any props or personal items you want included</li>
        <li>Have touch-up supplies handy (lip balm, powder, hair spray)</li>
        <li>Eat a good meal beforehand</li>
        <li>Most importantly: relax and have fun!</li>
    </ul>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">If anything changes or you have questions, just reply to this email.</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">See you soon!<br>{{photographer_name}}</p>
</div>',
    E'Hi {{client_first_name}},\n\nWe''re just one week away from your {{event_type}}!\n\nDate: {{event_date_formatted}}\nArrival Time: {{event_time_formatted}}\nLocation: {{event_location}}\n\nDay-Of Checklist:\n- Arrive 10-15 minutes early\n- Bring any props or personal items\n- Have touch-up supplies handy\n- Eat a good meal beforehand\n- Relax and have fun!\n\nSee you soon!\n{{photographer_name}}',
    -7,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Final Check-in (2 days before)
INSERT INTO workflow_templates (id, user_id, name, description, category, subject, body_html, body_text, default_days_offset, is_system)
VALUES (
    'a1b2c3d4-0004-4000-8000-000000000004',
    NULL,
    'Final Check-in',
    'Quick confirmation two days before the event',
    'pre_event',
    'Quick Check-in - See You in 2 Days!',
    E'<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <h1 style="font-size: 24px; font-weight: normal; margin-bottom: 24px;">Hi {{client_first_name}},</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">Just a quick note to say I''m excited for your {{event_type}} on <strong>{{event_date_formatted}}</strong>!</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">Everything is set on my end. If you have any last-minute questions or changes, feel free to reach out.</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">Otherwise, I''ll see you there!</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">{{photographer_name}}<br><span style="color: #666;">{{photographer_phone}}</span></p>
</div>',
    E'Hi {{client_first_name}},\n\nJust a quick note to say I''m excited for your {{event_type}} on {{event_date_formatted}}!\n\nEverything is set on my end. If you have any last-minute questions, feel free to reach out.\n\nSee you there!\n\n{{photographer_name}}\n{{photographer_phone}}',
    -2,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Post-Event Thank You (1 day after)
INSERT INTO workflow_templates (id, user_id, name, description, category, subject, body_html, body_text, default_days_offset, is_system)
VALUES (
    'a1b2c3d4-0005-4000-8000-000000000005',
    NULL,
    'Post-Event Thank You',
    'Thank clients and set expectations for delivery',
    'post_event',
    'Thank You! Here''s What''s Next',
    E'<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <h1 style="font-size: 24px; font-weight: normal; margin-bottom: 24px;">Hi {{client_first_name}},</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you so much for an amazing {{event_type}} yesterday! It was such a pleasure working with you.</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">I captured some beautiful moments and can''t wait to share them with you.</p>
    <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 16px;">What''s Next</h2>
    <ul style="font-size: 16px; line-height: 1.8; color: #333;">
        <li>I''ll begin editing your photos this week</li>
        <li>You''ll receive your gallery within {{delivery_window}} days</li>
        <li>I''ll send you a link to view and download your images</li>
    </ul>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">In the meantime, if you have any favorites from the day or specific requests, let me know!</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">With gratitude,<br>{{photographer_name}}</p>
</div>',
    E'Hi {{client_first_name}},\n\nThank you so much for an amazing {{event_type}} yesterday! It was such a pleasure working with you.\n\nWhat''s Next:\n- I''ll begin editing your photos this week\n- You''ll receive your gallery within {{delivery_window}} days\n- I''ll send you a link to view and download your images\n\nWith gratitude,\n{{photographer_name}}',
    1,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. GRANTS FOR SERVICE ROLE (cron job access)
-- -----------------------------------------------------------------------------
GRANT SELECT, UPDATE ON scheduled_workflows TO service_role;
GRANT INSERT ON workflow_execution_log TO service_role;
GRANT SELECT ON workflow_templates TO service_role;
