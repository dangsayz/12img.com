-- ============================================
-- Migration 032: Contracts System
-- ============================================
-- Complete contract management with templates,
-- clauses, merge fields, and e-signatures
-- ============================================

-- Create contract status enum
CREATE TYPE contract_status AS ENUM (
    'draft',      -- Being edited by photographer
    'sent',       -- Sent to client, awaiting view
    'viewed',     -- Client has opened the contract
    'signed',     -- Client has signed (immutable)
    'archived'    -- Historical record
);

-- Create clause category enum
CREATE TYPE clause_category AS ENUM (
    'payment',
    'cancellation',
    'liability',
    'copyright',
    'usage_rights',
    'delivery',
    'scheduling',
    'meals_breaks',
    'travel',
    'equipment',
    'force_majeure',
    'dispute_resolution',
    'custom'
);

-- ============================================
-- Contract Templates
-- ============================================

CREATE TABLE public.contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Template Info
    name TEXT NOT NULL,
    description TEXT,
    
    -- Template Content (with merge field placeholders)
    -- Merge fields: {{client_name}}, {{event_date}}, {{package_price}}, etc.
    header_content TEXT NOT NULL DEFAULT '',
    footer_content TEXT NOT NULL DEFAULT '',
    
    -- Settings
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_templates_photographer ON public.contract_templates(photographer_id);
CREATE INDEX idx_contract_templates_default ON public.contract_templates(photographer_id, is_default) WHERE is_default = true;

-- ============================================
-- Contract Clauses (Modular Library)
-- ============================================

CREATE TABLE public.contract_clauses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- NULL photographer_id = system-provided clause
    -- Non-null = custom clause by photographer
    
    -- Clause Info
    title TEXT NOT NULL,
    category clause_category NOT NULL DEFAULT 'custom',
    content TEXT NOT NULL,
    
    -- Settings
    is_required BOOLEAN NOT NULL DEFAULT false,  -- Must be included
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_clauses_photographer ON public.contract_clauses(photographer_id);
CREATE INDEX idx_contract_clauses_category ON public.contract_clauses(category);
CREATE INDEX idx_contract_clauses_system ON public.contract_clauses(photographer_id) WHERE photographer_id IS NULL;

-- ============================================
-- Template-Clause Junction
-- ============================================

CREATE TABLE public.template_clauses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
    clause_id UUID NOT NULL REFERENCES public.contract_clauses(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    
    UNIQUE(template_id, clause_id)
);

CREATE INDEX idx_template_clauses_template ON public.template_clauses(template_id);

-- ============================================
-- Contracts (Generated from Templates)
-- ============================================

CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
    
    -- Contract Status
    status contract_status NOT NULL DEFAULT 'draft',
    
    -- Rendered Content (frozen at send time)
    rendered_html TEXT,
    rendered_text TEXT,  -- Plain text version for accessibility
    
    -- Merge Field Data (JSON snapshot at render time)
    merge_data JSONB NOT NULL DEFAULT '{}',
    
    -- Selected Clauses (JSON array of clause IDs + content at render time)
    clauses_snapshot JSONB NOT NULL DEFAULT '[]',
    
    -- Tracking
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status_transitions CHECK (
        -- Can only sign if sent or viewed
        (status != 'signed' OR sent_at IS NOT NULL) AND
        -- Can only archive if signed
        (status != 'archived' OR signed_at IS NOT NULL)
    )
);

CREATE INDEX idx_contracts_photographer ON public.contracts(photographer_id);
CREATE INDEX idx_contracts_client ON public.contracts(client_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_created ON public.contracts(created_at DESC);

-- ============================================
-- Contract Signatures
-- ============================================

CREATE TABLE public.contract_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    
    -- Signer Info
    signer_name TEXT NOT NULL,
    signer_email TEXT NOT NULL,
    signer_ip TEXT,
    signer_user_agent TEXT,
    
    -- Signature Data
    signature_data TEXT NOT NULL,  -- Base64 encoded signature image
    signature_hash TEXT NOT NULL,  -- SHA-256 hash for verification
    
    -- Legal Timestamp
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Consent
    agreed_to_terms BOOLEAN NOT NULL DEFAULT true,
    
    -- This table is IMMUTABLE - no updates allowed
    
    UNIQUE(contract_id)  -- One signature per contract
);

CREATE INDEX idx_contract_signatures_contract ON public.contract_signatures(contract_id);

-- ============================================
-- Triggers
-- ============================================

-- Updated at triggers
CREATE TRIGGER update_contract_templates_updated_at
    BEFORE UPDATE ON public.contract_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_clauses_updated_at
    BEFORE UPDATE ON public.contract_clauses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Prevent signature updates
CREATE OR REPLACE FUNCTION prevent_signature_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Contract signatures are immutable and cannot be updated';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_signature_modification
    BEFORE UPDATE ON public.contract_signatures
    FOR EACH ROW
    EXECUTE FUNCTION prevent_signature_update();

-- Update contract status when signed
CREATE OR REPLACE FUNCTION update_contract_on_signature()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.contracts
    SET 
        status = 'signed',
        signed_at = NEW.signed_at
    WHERE id = NEW.contract_id
      AND status IN ('sent', 'viewed');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_signed_trigger
    AFTER INSERT ON public.contract_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_on_signature();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

-- Contract Templates
CREATE POLICY "Photographers can manage own templates"
    ON public.contract_templates
    FOR ALL
    USING (photographer_id = auth.uid())
    WITH CHECK (photographer_id = auth.uid());

-- Contract Clauses (system + own)
CREATE POLICY "View system and own clauses"
    ON public.contract_clauses
    FOR SELECT
    USING (photographer_id IS NULL OR photographer_id = auth.uid());

CREATE POLICY "Manage own clauses"
    ON public.contract_clauses
    FOR ALL
    USING (photographer_id = auth.uid())
    WITH CHECK (photographer_id = auth.uid());

-- Template Clauses
CREATE POLICY "Manage template clauses for own templates"
    ON public.template_clauses
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.contract_templates
            WHERE id = template_id AND photographer_id = auth.uid()
        )
    );

-- Contracts
CREATE POLICY "Photographers can manage own contracts"
    ON public.contracts
    FOR ALL
    USING (photographer_id = auth.uid())
    WITH CHECK (photographer_id = auth.uid());

-- Contract Signatures (read-only for photographer, insert for client via token)
CREATE POLICY "Photographers can view signatures"
    ON public.contract_signatures
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE id = contract_id AND photographer_id = auth.uid()
        )
    );

-- Note: Client signature insertion is handled via service role in server actions

-- ============================================
-- System Clauses (Default Library)
-- ============================================

INSERT INTO public.contract_clauses (photographer_id, title, category, content, is_required, sort_order) VALUES
-- Payment Terms
(NULL, 'Payment Terms', 'payment', 
'A non-refundable retainer of {{retainer_amount}} is due upon signing this agreement to secure the date. The remaining balance of {{remaining_balance}} is due {{payment_due_date}}. Accepted payment methods include bank transfer, credit card, or check.',
false, 1),

-- Cancellation Policy
(NULL, 'Cancellation Policy', 'cancellation',
'If the Client cancels this agreement, the retainer is non-refundable. Cancellations made within 30 days of the event date will result in forfeiture of 50% of the total package price. If the Photographer must cancel due to unforeseen circumstances, all payments will be refunded in full.',
false, 2),

-- Liability Limitation
(NULL, 'Limitation of Liability', 'liability',
'In the unlikely event of total photographic failure or loss of images due to equipment malfunction, memory card failure, or other unforeseen circumstances, the Photographer''s liability is limited to a full refund of all payments received. The Photographer is not responsible for compromised coverage due to causes beyond their control.',
true, 3),

-- Copyright & Usage
(NULL, 'Copyright & Image Usage', 'copyright',
'The Photographer retains full copyright of all images. The Client is granted a personal, non-exclusive license to use the images for personal purposes. The Photographer reserves the right to use images for portfolio, marketing, social media, and promotional purposes unless otherwise agreed in writing.',
true, 4),

-- Delivery Timeline
(NULL, 'Image Delivery', 'delivery',
'The Client will receive a private online gallery within {{delivery_weeks}} weeks of the event date. The gallery will contain {{estimated_images}} professionally edited images. The gallery link will remain active for {{gallery_expiry_days}} days.',
false, 5),

-- Scheduling & Hours
(NULL, 'Coverage Hours', 'scheduling',
'This agreement covers {{package_hours}} hours of photography coverage on {{event_date}}. Coverage will begin at {{start_time}} and end at {{end_time}}. Additional hours may be purchased at ${{hourly_rate}}/hour, subject to availability.',
false, 6),

-- Meals & Breaks
(NULL, 'Meals & Breaks', 'meals_breaks',
'For events exceeding 5 hours, the Client agrees to provide a meal for the Photographer equivalent to guest meals. The Photographer will take a 30-minute break during the meal service. If a meal cannot be provided, a $50 meal allowance will be added to the final invoice.',
false, 7),

-- Travel
(NULL, 'Travel & Accommodation', 'travel',
'Travel within {{travel_radius}} miles of {{photographer_location}} is included. For locations beyond this radius, a travel fee of ${{travel_rate}}/mile will apply. For destination events requiring overnight stay, the Client agrees to cover reasonable accommodation and travel expenses.',
false, 8),

-- Force Majeure
(NULL, 'Force Majeure', 'force_majeure',
'Neither party shall be liable for failure to perform due to circumstances beyond reasonable control, including but not limited to: natural disasters, pandemic, government restrictions, venue closure, or other acts of God. In such cases, the parties will work together to reschedule or reach a mutually agreeable resolution.',
false, 9),

-- Dispute Resolution
(NULL, 'Dispute Resolution', 'dispute_resolution',
'Any disputes arising from this agreement shall first be addressed through good-faith negotiation. If unresolved, disputes will be submitted to binding arbitration in {{arbitration_location}} under the rules of the American Arbitration Association. This agreement is governed by the laws of {{governing_state}}.',
false, 10);

-- ============================================
-- Helper Functions
-- ============================================

-- Get contract status display name
CREATE OR REPLACE FUNCTION get_contract_status_label(p_status contract_status)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE p_status
        WHEN 'draft' THEN 'Draft'
        WHEN 'sent' THEN 'Awaiting Signature'
        WHEN 'viewed' THEN 'Viewed'
        WHEN 'signed' THEN 'Signed'
        WHEN 'archived' THEN 'Archived'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if contract can be edited
CREATE OR REPLACE FUNCTION can_edit_contract(p_contract_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_status contract_status;
BEGIN
    SELECT status INTO v_status
    FROM public.contracts
    WHERE id = p_contract_id;
    
    RETURN v_status = 'draft';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.contract_templates IS 'Master contract templates with merge field placeholders';
COMMENT ON TABLE public.contract_clauses IS 'Modular clause library - NULL photographer_id means system-provided';
COMMENT ON TABLE public.contracts IS 'Generated contracts with frozen content at send time';
COMMENT ON TABLE public.contract_signatures IS 'Immutable signature records with legal timestamps';
COMMENT ON COLUMN public.contracts.merge_data IS 'JSON snapshot of all merge field values at render time';
COMMENT ON COLUMN public.contracts.clauses_snapshot IS 'JSON array of clause content frozen at render time';
