-- Admin Notifications System
-- Tracks important events for admin dashboard

-- =====================================================
-- ADMIN NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'new_user', 'new_subscription', 'subscription_cancelled', 'support_ticket', etc.
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}', -- Additional data like user_id, plan, etc.
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for unread notifications
CREATE INDEX idx_admin_notifications_unread ON admin_notifications(is_read, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type, created_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Create an admin notification
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO admin_notifications (type, title, message, metadata)
  VALUES (p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_admin_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM admin_notifications WHERE is_read = FALSE);
END;
$$;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_admin_notification_read(
  p_notification_id UUID,
  p_admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_notifications
  SET is_read = TRUE, read_at = NOW(), read_by = p_admin_user_id
  WHERE id = p_notification_id AND is_read = FALSE;
  
  RETURN FOUND;
END;
$$;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_admin_notifications_read(
  p_admin_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE admin_notifications
  SET is_read = TRUE, read_at = NOW(), read_by = p_admin_user_id
  WHERE is_read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-create notification on new user
-- =====================================================

CREATE OR REPLACE FUNCTION notify_on_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_user',
    'New User Signed Up',
    NEW.email,
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'clerk_id', NEW.clerk_id
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new users
DROP TRIGGER IF EXISTS trigger_notify_new_user ON users;
CREATE TRIGGER trigger_notify_new_user
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_user();

-- =====================================================
-- RLS POLICIES (Admin only via service role)
-- =====================================================

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin notifications are accessed via service role (supabaseAdmin) only
-- No direct client access needed - all access goes through server actions
-- This policy allows service role full access
CREATE POLICY "Service role has full access"
  ON admin_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);
