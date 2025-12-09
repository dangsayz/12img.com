-- ============================================
-- Migration 055: Vendor Network
-- ============================================
-- Enables photographers to build professional relationships
-- with event vendors by sharing curated galleries with usage terms
-- ============================================

-- ============================================
-- VENDOR CATEGORIES TYPE
-- ============================================

CREATE TYPE vendor_category AS ENUM (
    'florist',
    'planner',
    'venue',
    'dj',
    'caterer',
    'bakery',
    'rentals',
    'hair_makeup',
    'videographer',
    'officiant',
    'transportation',
    'other'
);

-- ============================================
-- VENDORS TABLE
-- ============================================

CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Vendor Info
    business_name TEXT NOT NULL,
    category vendor_category NOT NULL DEFAULT 'other',
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    instagram_handle TEXT,
    website TEXT,
    
    -- Branding
    logo_url TEXT,
    color TEXT,  -- Hex color for avatar fallback (e.g., '#E91E63')
    
    -- Notes
    notes TEXT,
    
    -- Status
    is_archived BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_vendor_email CHECK (
        email IS NULL OR 
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT valid_instagram_handle CHECK (
        instagram_handle IS NULL OR 
        instagram_handle ~* '^@?[A-Za-z0-9._]+$'
    )
);

-- Indexes
CREATE INDEX idx_vendors_user ON public.vendors(user_id);
CREATE INDEX idx_vendors_category ON public.vendors(user_id, category);
CREATE INDEX idx_vendors_archived ON public.vendors(user_id, is_archived);
CREATE INDEX idx_vendors_created ON public.vendors(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VENDOR TERMS TEMPLATES TABLE
-- ============================================

CREATE TABLE public.vendor_terms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_system BOOLEAN NOT NULL DEFAULT false,  -- Pre-built templates
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vendor_terms_user ON public.vendor_terms_templates(user_id);
CREATE INDEX idx_vendor_terms_default ON public.vendor_terms_templates(user_id, is_default);

-- Updated_at trigger
CREATE TRIGGER update_vendor_terms_updated_at
    BEFORE UPDATE ON public.vendor_terms_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GALLERY VENDOR SHARES TABLE
-- ============================================

CREATE TABLE public.gallery_vendor_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,  -- Denormalized for RLS
    
    -- Share Configuration
    share_type TEXT NOT NULL DEFAULT 'entire' CHECK (share_type IN ('entire', 'selected')),
    terms_template_id UUID REFERENCES public.vendor_terms_templates(id) ON DELETE SET NULL,
    custom_terms TEXT,  -- Override template with custom terms for this share
    
    -- Access Token (for vendor portal)
    access_token TEXT NOT NULL UNIQUE,
    
    -- Tracking
    shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    view_count INTEGER NOT NULL DEFAULT 0,
    downloaded_at TIMESTAMPTZ,
    download_count INTEGER NOT NULL DEFAULT 0,
    terms_accepted_at TIMESTAMPTZ,
    
    -- Status
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    
    UNIQUE(gallery_id, vendor_id)
);

-- Indexes
CREATE INDEX idx_gallery_vendor_shares_gallery ON public.gallery_vendor_shares(gallery_id);
CREATE INDEX idx_gallery_vendor_shares_vendor ON public.gallery_vendor_shares(vendor_id);
CREATE INDEX idx_gallery_vendor_shares_user ON public.gallery_vendor_shares(user_id);
CREATE INDEX idx_gallery_vendor_shares_token ON public.gallery_vendor_shares(access_token);
CREATE INDEX idx_gallery_vendor_shares_active ON public.gallery_vendor_shares(gallery_id, is_revoked) 
    WHERE is_revoked = false;

-- ============================================
-- GALLERY VENDOR IMAGES TABLE
-- ============================================

CREATE TABLE public.gallery_vendor_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES public.gallery_vendor_shares(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(share_id, image_id)
);

-- Indexes
CREATE INDEX idx_gallery_vendor_images_share ON public.gallery_vendor_images(share_id);
CREATE INDEX idx_gallery_vendor_images_image ON public.gallery_vendor_images(image_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_terms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_vendor_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_vendor_images ENABLE ROW LEVEL SECURITY;

-- Vendors
CREATE POLICY "Users can view own vendors"
    ON public.vendors FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create vendors"
    ON public.vendors FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vendors"
    ON public.vendors FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own vendors"
    ON public.vendors FOR DELETE
    USING (user_id = auth.uid());

-- Vendor Terms Templates
CREATE POLICY "Users can view own terms templates"
    ON public.vendor_terms_templates FOR SELECT
    USING (user_id = auth.uid() OR is_system = true);

CREATE POLICY "Users can create terms templates"
    ON public.vendor_terms_templates FOR INSERT
    WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can update own terms templates"
    ON public.vendor_terms_templates FOR UPDATE
    USING (user_id = auth.uid() AND is_system = false)
    WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete own terms templates"
    ON public.vendor_terms_templates FOR DELETE
    USING (user_id = auth.uid() AND is_system = false);

-- Gallery Vendor Shares
CREATE POLICY "Users can view own shares"
    ON public.gallery_vendor_shares FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create shares"
    ON public.gallery_vendor_shares FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own shares"
    ON public.gallery_vendor_shares FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own shares"
    ON public.gallery_vendor_shares FOR DELETE
    USING (user_id = auth.uid());

-- Public access for vendor portal (by token)
CREATE POLICY "Public can view shares by token"
    ON public.gallery_vendor_shares FOR SELECT
    USING (is_revoked = false);

-- Gallery Vendor Images
CREATE POLICY "Users can view own share images"
    ON public.gallery_vendor_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.gallery_vendor_shares gvs
            WHERE gvs.id = share_id AND gvs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own share images"
    ON public.gallery_vendor_shares FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Public access for vendor portal
CREATE POLICY "Public can view share images by token"
    ON public.gallery_vendor_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.gallery_vendor_shares gvs
            WHERE gvs.id = share_id AND gvs.is_revoked = false
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate unique access token
CREATE OR REPLACE FUNCTION generate_vendor_access_token()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..24 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get vendor count for user
CREATE OR REPLACE FUNCTION get_vendor_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.vendors
        WHERE user_id = p_user_id AND is_archived = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get monthly share count for user
CREATE OR REPLACE FUNCTION get_monthly_vendor_share_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.gallery_vendor_shares
        WHERE user_id = p_user_id
          AND shared_at >= date_trunc('month', CURRENT_DATE)
          AND shared_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get terms template count for user
CREATE OR REPLACE FUNCTION get_vendor_terms_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.vendor_terms_templates
        WHERE user_id = p_user_id AND is_system = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track vendor view
CREATE OR REPLACE FUNCTION track_vendor_share_view(p_token TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.gallery_vendor_shares
    SET 
        viewed_at = COALESCE(viewed_at, NOW()),
        view_count = view_count + 1
    WHERE access_token = p_token AND is_revoked = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track vendor download
CREATE OR REPLACE FUNCTION track_vendor_share_download(p_token TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.gallery_vendor_shares
    SET 
        downloaded_at = COALESCE(downloaded_at, NOW()),
        download_count = download_count + 1
    WHERE access_token = p_token AND is_revoked = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accept vendor terms
CREATE OR REPLACE FUNCTION accept_vendor_share_terms(p_token TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.gallery_vendor_shares
    SET terms_accepted_at = NOW()
    WHERE access_token = p_token 
      AND is_revoked = false
      AND terms_accepted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INSERT SYSTEM TERMS TEMPLATE
-- ============================================

-- Note: This will be inserted per-user when they first access vendor features
-- or we can create a global system template

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.vendors IS 'Vendor contacts in a photographer''s network';
COMMENT ON TABLE public.vendor_terms_templates IS 'Reusable media usage terms for vendor shares';
COMMENT ON TABLE public.gallery_vendor_shares IS 'Gallery shares with vendors including access tokens';
COMMENT ON TABLE public.gallery_vendor_images IS 'Selected images for partial vendor shares';

COMMENT ON COLUMN public.vendors.category IS 'Vendor type: florist, planner, venue, dj, caterer, bakery, rentals, hair_makeup, videographer, officiant, transportation, other';
COMMENT ON COLUMN public.vendors.instagram_handle IS 'Instagram handle with or without @ prefix';
COMMENT ON COLUMN public.vendors.color IS 'Hex color for avatar background when no logo';

COMMENT ON COLUMN public.gallery_vendor_shares.share_type IS 'entire = all gallery images, selected = specific images only';
COMMENT ON COLUMN public.gallery_vendor_shares.access_token IS 'Unique token for vendor portal access';
COMMENT ON COLUMN public.gallery_vendor_shares.custom_terms IS 'Override template terms for this specific share';
