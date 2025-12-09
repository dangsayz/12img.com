-- ============================================================================
-- PATCH: Add arrival time to Timeline Reminder template
-- Migration: 053-timeline-reminder-add-time.sql
-- ============================================================================

-- Update the Timeline Reminder system template to include arrival time
UPDATE workflow_templates
SET 
    body_html = E'<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
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
    body_text = E'Hi {{client_first_name}},\n\nWe''re just one week away from your {{event_type}}!\n\nDate: {{event_date_formatted}}\nArrival Time: {{event_time_formatted}}\nLocation: {{event_location}}\n\nDay-Of Checklist:\n- Arrive 10-15 minutes early\n- Bring any props or personal items\n- Have touch-up supplies handy\n- Eat a good meal beforehand\n- Relax and have fun!\n\nSee you soon!\n{{photographer_name}}',
    updated_at = NOW()
WHERE id = 'a1b2c3d4-0003-4000-8000-000000000003'
AND is_system = TRUE;
