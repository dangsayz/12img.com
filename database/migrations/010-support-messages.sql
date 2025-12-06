-- Migration: Support Messages System
-- User-to-admin messaging with conversation threading

-- Support conversations table
CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  subject TEXT, -- optional, can be null for simple "help me" messages
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_id UUID NOT NULL, -- user_id or admin user_id
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ, -- when the recipient read it
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_conversations_user ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_conversations_updated ON support_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at);

-- Enable RLS
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for support_conversations
-- Users can see their own conversations
CREATE POLICY "Users can view own conversations" ON support_conversations 
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON support_conversations 
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations" ON support_conversations 
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role IN ('admin', 'super_admin')));

-- Admins can update conversations (change status)
CREATE POLICY "Admins can update conversations" ON support_conversations 
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role IN ('admin', 'super_admin')));

-- Policies for support_messages
-- Users can view messages in their conversations
CREATE POLICY "Users can view own messages" ON support_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_conversations sc 
      WHERE sc.id = conversation_id 
      AND sc.user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    )
  );

-- Users can send messages to their conversations
CREATE POLICY "Users can send messages" ON support_messages 
  FOR INSERT WITH CHECK (
    sender_type = 'user' AND
    EXISTS (
      SELECT 1 FROM support_conversations sc 
      WHERE sc.id = conversation_id 
      AND sc.user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON support_messages 
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role IN ('admin', 'super_admin')));

-- Admins can send messages
CREATE POLICY "Admins can send messages" ON support_messages 
  FOR INSERT WITH CHECK (
    sender_type = 'admin' AND
    EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role IN ('admin', 'super_admin'))
  );

-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update messages" ON support_messages 
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role IN ('admin', 'super_admin')));

-- Update timestamp trigger
CREATE TRIGGER support_conversations_updated_at
  BEFORE UPDATE ON support_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to get or create conversation for a user
CREATE OR REPLACE FUNCTION get_or_create_support_conversation(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing open conversation
  SELECT id INTO v_conversation_id 
  FROM support_conversations 
  WHERE user_id = p_user_id AND status = 'open'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If not found, create new one
  IF v_conversation_id IS NULL THEN
    INSERT INTO support_conversations (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
