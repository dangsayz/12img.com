-- ============================================
-- Migration 033: Messaging System
-- ============================================
-- Real-time messaging between photographers and clients
-- Supports attachments, read receipts, and typing indicators
-- ============================================

-- Create message status enum
CREATE TYPE message_status AS ENUM (
    'sent',       -- Message created
    'delivered',  -- Recipient received (online)
    'read'        -- Recipient viewed
);

-- Create message type enum
CREATE TYPE message_type AS ENUM (
    'text',       -- Regular text message
    'image',      -- Image attachment
    'file',       -- File attachment
    'system'      -- System notification
);

-- ============================================
-- Messages Table
-- ============================================

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Thread identification
    client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    photographer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Sender identification
    -- TRUE = photographer sent, FALSE = client sent
    is_from_photographer BOOLEAN NOT NULL,
    
    -- Message content
    message_type message_type NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    
    -- Status tracking
    status message_status NOT NULL DEFAULT 'sent',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by_photographer BOOLEAN DEFAULT false,
    deleted_by_client BOOLEAN DEFAULT false,
    
    -- Constraints
    CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0 OR message_type != 'text')
);

-- Indexes for performance
CREATE INDEX idx_messages_thread ON public.messages(client_id, photographer_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages(client_id, status) WHERE status != 'read';
CREATE INDEX idx_messages_photographer_unread ON public.messages(photographer_id, is_from_photographer, status) 
    WHERE is_from_photographer = false AND status != 'read';

-- ============================================
-- Message Attachments
-- ============================================

CREATE TABLE public.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    
    -- File info
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,  -- bytes
    storage_path TEXT NOT NULL,
    
    -- Image-specific
    width INTEGER,
    height INTEGER,
    thumbnail_path TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 26214400)  -- 25MB max
);

CREATE INDEX idx_message_attachments_message ON public.message_attachments(message_id);

-- ============================================
-- Typing Indicators (Ephemeral)
-- ============================================

CREATE TABLE public.typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    photographer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_photographer_typing BOOLEAN NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Only one indicator per thread per sender
    UNIQUE(client_id, photographer_id, is_photographer_typing)
);

-- Auto-cleanup old typing indicators (older than 10 seconds)
CREATE INDEX idx_typing_indicators_cleanup ON public.typing_indicators(updated_at);

-- ============================================
-- Message Read Receipts (Batch)
-- ============================================

CREATE TABLE public.message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    photographer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Who read
    read_by_photographer BOOLEAN NOT NULL,
    
    -- Last read message
    last_read_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(client_id, photographer_id, read_by_photographer)
);

CREATE INDEX idx_message_read_receipts_thread ON public.message_read_receipts(client_id, photographer_id);

-- ============================================
-- Triggers
-- ============================================

-- Update message status when delivered
CREATE OR REPLACE FUNCTION update_message_delivered()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND OLD.status = 'sent' THEN
        NEW.delivered_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_delivered_trigger
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    WHEN (NEW.status = 'delivered' AND OLD.status = 'sent')
    EXECUTE FUNCTION update_message_delivered();

-- Update message status when read
CREATE OR REPLACE FUNCTION update_message_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'read' AND OLD.status IN ('sent', 'delivered') THEN
        NEW.read_at = NOW();
        IF NEW.delivered_at IS NULL THEN
            NEW.delivered_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_read_trigger
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    WHEN (NEW.status = 'read')
    EXECUTE FUNCTION update_message_read();

-- Cleanup old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.typing_indicators
    WHERE updated_at < NOW() - INTERVAL '10 seconds';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Messages: Photographer can see all their threads
CREATE POLICY "Photographers can view own messages"
    ON public.messages
    FOR SELECT
    USING (photographer_id = auth.uid());

CREATE POLICY "Photographers can send messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (photographer_id = auth.uid() AND is_from_photographer = true);

CREATE POLICY "Photographers can update message status"
    ON public.messages
    FOR UPDATE
    USING (photographer_id = auth.uid())
    WITH CHECK (photographer_id = auth.uid());

-- Note: Client message insertion is handled via service role in server actions

-- Message Attachments
CREATE POLICY "View attachments for accessible messages"
    ON public.message_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.messages
            WHERE id = message_id AND photographer_id = auth.uid()
        )
    );

CREATE POLICY "Create attachments for own messages"
    ON public.message_attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.messages
            WHERE id = message_id AND photographer_id = auth.uid()
        )
    );

-- Typing Indicators
CREATE POLICY "Manage own typing indicators"
    ON public.typing_indicators
    FOR ALL
    USING (photographer_id = auth.uid());

-- Read Receipts
CREATE POLICY "Manage own read receipts"
    ON public.message_read_receipts
    FOR ALL
    USING (photographer_id = auth.uid());

-- ============================================
-- Helper Functions
-- ============================================

-- Get unread message count for photographer
CREATE OR REPLACE FUNCTION get_photographer_unread_count(p_photographer_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.messages
        WHERE photographer_id = p_photographer_id
          AND is_from_photographer = false
          AND status != 'read'
          AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread count for a specific thread
CREATE OR REPLACE FUNCTION get_thread_unread_count(
    p_client_id UUID,
    p_photographer_id UUID,
    p_for_photographer BOOLEAN
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.messages
        WHERE client_id = p_client_id
          AND photographer_id = p_photographer_id
          AND is_from_photographer != p_for_photographer
          AND status != 'read'
          AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all messages in thread as read
CREATE OR REPLACE FUNCTION mark_thread_read(
    p_client_id UUID,
    p_photographer_id UUID,
    p_by_photographer BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.messages
    SET status = 'read'
    WHERE client_id = p_client_id
      AND photographer_id = p_photographer_id
      AND is_from_photographer != p_by_photographer
      AND status != 'read'
      AND deleted_at IS NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Update read receipt
    INSERT INTO public.message_read_receipts (
        client_id, photographer_id, read_by_photographer, last_read_at
    ) VALUES (
        p_client_id, p_photographer_id, p_by_photographer, NOW()
    )
    ON CONFLICT (client_id, photographer_id, read_by_photographer)
    DO UPDATE SET last_read_at = NOW();
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get latest message preview for each thread
CREATE OR REPLACE FUNCTION get_message_threads(p_photographer_id UUID)
RETURNS TABLE (
    client_id UUID,
    client_name TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    is_from_photographer BOOLEAN,
    unread_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT DISTINCT ON (m.client_id)
            m.client_id,
            m.content,
            m.created_at,
            m.is_from_photographer
        FROM public.messages m
        WHERE m.photographer_id = p_photographer_id
          AND m.deleted_at IS NULL
        ORDER BY m.client_id, m.created_at DESC
    )
    SELECT 
        lm.client_id,
        get_client_full_name(lm.client_id),
        lm.content,
        lm.created_at,
        lm.is_from_photographer,
        get_thread_unread_count(lm.client_id, p_photographer_id, true)
    FROM latest_messages lm
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Realtime Subscriptions
-- ============================================

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.messages IS 'Real-time messages between photographers and clients';
COMMENT ON TABLE public.message_attachments IS 'File attachments for messages (images, documents)';
COMMENT ON TABLE public.typing_indicators IS 'Ephemeral typing status - auto-cleaned after 10 seconds';
COMMENT ON COLUMN public.messages.is_from_photographer IS 'TRUE = photographer sent, FALSE = client sent';
COMMENT ON COLUMN public.messages.status IS 'Message delivery status: sent → delivered → read';
