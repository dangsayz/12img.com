-- ============================================
-- Migration 034: Portal Access Tokens
-- ============================================
-- Secure token-based access for client portal
-- No authentication required - signed tokens with expiry
-- ============================================

-- ============================================
-- Portal Tokens Table
-- ============================================

CREATE TABLE public.portal_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    photographer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Token (HMAC-SHA256 signed)
    token TEXT NOT NULL UNIQUE,
    token_hash TEXT NOT NULL,  -- For secure lookup
    
    -- Permissions
    can_view_contract BOOLEAN NOT NULL DEFAULT true,
    can_sign_contract BOOLEAN NOT NULL DEFAULT true,
    can_message BOOLEAN NOT NULL DEFAULT true,
    can_view_gallery BOOLEAN NOT NULL DEFAULT false,  -- Future: gallery access
    can_download BOOLEAN NOT NULL DEFAULT false,       -- Future: download access
    
    -- Expiry & Status
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    use_count INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_expiry CHECK (expires_at > created_at),
    CONSTRAINT valid_revocation CHECK (
        (is_revoked = false AND revoked_at IS NULL) OR
        (is_revoked = true AND revoked_at IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_portal_tokens_client ON public.portal_tokens(client_id);
CREATE INDEX idx_portal_tokens_photographer ON public.portal_tokens(photographer_id);
CREATE INDEX idx_portal_tokens_hash ON public.portal_tokens(token_hash);
CREATE INDEX idx_portal_tokens_active ON public.portal_tokens(client_id, is_revoked, expires_at) 
    WHERE is_revoked = false;

-- ============================================
-- Portal Access Logs
-- ============================================

CREATE TABLE public.portal_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID NOT NULL REFERENCES public.portal_tokens(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    
    -- Access details
    action TEXT NOT NULL,  -- 'view_portal', 'view_contract', 'sign_contract', 'send_message'
    ip_address TEXT,
    user_agent TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_portal_access_logs_token ON public.portal_access_logs(token_id);
CREATE INDEX idx_portal_access_logs_client ON public.portal_access_logs(client_id);
CREATE INDEX idx_portal_access_logs_created ON public.portal_access_logs(created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_access_logs ENABLE ROW LEVEL SECURITY;

-- Portal Tokens
CREATE POLICY "Photographers can manage own tokens"
    ON public.portal_tokens
    FOR ALL
    USING (photographer_id = auth.uid())
    WITH CHECK (photographer_id = auth.uid());

-- Portal Access Logs
CREATE POLICY "Photographers can view own access logs"
    ON public.portal_access_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.portal_tokens
            WHERE id = token_id AND photographer_id = auth.uid()
        )
    );

-- ============================================
-- Helper Functions
-- ============================================

-- Generate secure token
CREATE OR REPLACE FUNCTION generate_portal_token(
    p_client_id UUID,
    p_photographer_id UUID,
    p_expires_in_days INTEGER DEFAULT 7
)
RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
    v_token_hash TEXT;
BEGIN
    -- Generate random token
    v_token := encode(gen_random_bytes(32), 'base64');
    v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
    
    -- Hash for storage
    v_token_hash := encode(sha256(v_token::bytea), 'hex');
    
    -- Insert token record
    INSERT INTO public.portal_tokens (
        client_id,
        photographer_id,
        token,
        token_hash,
        expires_at
    ) VALUES (
        p_client_id,
        p_photographer_id,
        v_token,
        v_token_hash,
        NOW() + (p_expires_in_days || ' days')::INTERVAL
    );
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate token and return client info
CREATE OR REPLACE FUNCTION validate_portal_token(p_token TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    client_id UUID,
    photographer_id UUID,
    can_view_contract BOOLEAN,
    can_sign_contract BOOLEAN,
    can_message BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_token_hash TEXT;
    v_record RECORD;
BEGIN
    -- Hash the provided token
    v_token_hash := encode(sha256(p_token::bytea), 'hex');
    
    -- Look up token
    SELECT pt.* INTO v_record
    FROM public.portal_tokens pt
    WHERE pt.token_hash = v_token_hash;
    
    -- Token not found
    IF v_record IS NULL THEN
        RETURN QUERY SELECT 
            false, NULL::UUID, NULL::UUID, false, false, false, 
            'Invalid or expired link'::TEXT;
        RETURN;
    END IF;
    
    -- Token revoked
    IF v_record.is_revoked THEN
        RETURN QUERY SELECT 
            false, NULL::UUID, NULL::UUID, false, false, false,
            'This link has been revoked'::TEXT;
        RETURN;
    END IF;
    
    -- Token expired
    IF v_record.expires_at < NOW() THEN
        RETURN QUERY SELECT 
            false, NULL::UUID, NULL::UUID, false, false, false,
            'This link has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Update usage
    UPDATE public.portal_tokens
    SET 
        last_used_at = NOW(),
        use_count = use_count + 1
    WHERE id = v_record.id;
    
    -- Return valid token info
    RETURN QUERY SELECT 
        true,
        v_record.client_id,
        v_record.photographer_id,
        v_record.can_view_contract,
        v_record.can_sign_contract,
        v_record.can_message,
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke token
CREATE OR REPLACE FUNCTION revoke_portal_token(
    p_token_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.portal_tokens
    SET 
        is_revoked = true,
        revoked_at = NOW(),
        revoked_reason = p_reason
    WHERE id = p_token_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke all tokens for a client
CREATE OR REPLACE FUNCTION revoke_all_client_tokens(
    p_client_id UUID,
    p_reason TEXT DEFAULT 'Bulk revocation'
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.portal_tokens
    SET 
        is_revoked = true,
        revoked_at = NOW(),
        revoked_reason = p_reason
    WHERE client_id = p_client_id
      AND is_revoked = false;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log portal access
CREATE OR REPLACE FUNCTION log_portal_access(
    p_token TEXT,
    p_action TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
    v_token_hash TEXT;
    v_token_record RECORD;
BEGIN
    v_token_hash := encode(sha256(p_token::bytea), 'hex');
    
    SELECT id, client_id INTO v_token_record
    FROM public.portal_tokens
    WHERE token_hash = v_token_hash;
    
    IF v_token_record IS NOT NULL THEN
        INSERT INTO public.portal_access_logs (
            token_id,
            client_id,
            action,
            ip_address,
            user_agent,
            metadata
        ) VALUES (
            v_token_record.id,
            v_token_record.client_id,
            p_action,
            p_ip_address,
            p_user_agent,
            p_metadata
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get active token for client
CREATE OR REPLACE FUNCTION get_active_portal_token(p_client_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
BEGIN
    SELECT token INTO v_token
    FROM public.portal_tokens
    WHERE client_id = p_client_id
      AND is_revoked = false
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Cleanup Job
-- ============================================

-- Function to cleanup expired tokens (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_portal_tokens()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Delete tokens expired more than 30 days ago
    DELETE FROM public.portal_tokens
    WHERE expires_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Storage Bucket for Attachments
-- ============================================

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'message-attachments',
    'message-attachments',
    false,
    26214400,  -- 25MB
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for contract PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contract-pdfs',
    'contract-pdfs',
    false,
    10485760,  -- 10MB
    ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for message attachments
CREATE POLICY "Photographers can upload attachments"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'message-attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Photographers can view own attachments"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'message-attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for contract PDFs
CREATE POLICY "Photographers can manage contract PDFs"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'contract-pdfs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'contract-pdfs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.portal_tokens IS 'Secure access tokens for client portal - no auth required';
COMMENT ON TABLE public.portal_access_logs IS 'Audit log of all portal access for security';
COMMENT ON COLUMN public.portal_tokens.token IS 'URL-safe base64 token shown to client';
COMMENT ON COLUMN public.portal_tokens.token_hash IS 'SHA-256 hash for secure database lookup';
COMMENT ON FUNCTION validate_portal_token IS 'Validates token and returns permissions - used by portal routes';
