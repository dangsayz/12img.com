-- ============================================
-- Migration 066: Gallery Analytics System
-- ============================================
-- Track gallery views and downloads independent of email:
-- - Log all gallery views (with deduplication)
-- - Log all gallery downloads
-- - Aggregate stats per gallery
-- ============================================

-- --------------------------------------------
-- gallery_views
-- Tracks individual view events
-- --------------------------------------------
CREATE TABLE public.gallery_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Which gallery
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    
    -- Visitor identification (for deduplication)
    visitor_id TEXT NOT NULL, -- Hash of IP + user agent for privacy
    ip_address TEXT,
    user_agent TEXT,
    
    -- Referrer tracking
    referrer TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_gallery_views_gallery_id ON public.gallery_views(gallery_id);
CREATE INDEX idx_gallery_views_created_at ON public.gallery_views(created_at DESC);
CREATE INDEX idx_gallery_views_visitor ON public.gallery_views(gallery_id, visitor_id);

-- --------------------------------------------
-- gallery_downloads
-- Tracks individual download events
-- --------------------------------------------
CREATE TABLE public.gallery_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Which gallery
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    
    -- Visitor identification
    visitor_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Download metadata
    download_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'selection', 'single'
    image_count INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gallery_downloads_gallery_id ON public.gallery_downloads(gallery_id);
CREATE INDEX idx_gallery_downloads_created_at ON public.gallery_downloads(created_at DESC);

-- --------------------------------------------
-- gallery_analytics (aggregated stats)
-- Denormalized for fast reads
-- --------------------------------------------
CREATE TABLE public.gallery_analytics (
    gallery_id UUID PRIMARY KEY REFERENCES public.galleries(id) ON DELETE CASCADE,
    
    -- View stats
    total_views INTEGER NOT NULL DEFAULT 0,
    unique_views INTEGER NOT NULL DEFAULT 0,
    first_view_at TIMESTAMPTZ,
    last_view_at TIMESTAMPTZ,
    
    -- Download stats
    total_downloads INTEGER NOT NULL DEFAULT 0,
    unique_downloads INTEGER NOT NULL DEFAULT 0,
    first_download_at TIMESTAMPTZ,
    last_download_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.gallery_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_analytics ENABLE ROW LEVEL SECURITY;

-- Gallery views: Users can only see views for their own galleries
CREATE POLICY "gallery_views_select_own"
    ON public.gallery_views
    FOR SELECT
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.uid()::text
        )
    );

-- Gallery downloads: Users can only see downloads for their own galleries
CREATE POLICY "gallery_downloads_select_own"
    ON public.gallery_downloads
    FOR SELECT
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.uid()::text
        )
    );

-- Gallery analytics: Users can only see analytics for their own galleries
CREATE POLICY "gallery_analytics_select_own"
    ON public.gallery_analytics
    FOR SELECT
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.uid()::text
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to record a gallery view
-- Returns true if this is a new unique view (for real-time feedback)
CREATE OR REPLACE FUNCTION record_gallery_view(
    p_gallery_id UUID,
    p_visitor_id TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_new_visitor BOOLEAN;
BEGIN
    -- Check if this visitor has viewed before (within last 24 hours)
    SELECT NOT EXISTS (
        SELECT 1 FROM public.gallery_views
        WHERE gallery_id = p_gallery_id 
        AND visitor_id = p_visitor_id
        AND created_at > NOW() - INTERVAL '24 hours'
    ) INTO v_is_new_visitor;
    
    -- Insert the view event
    INSERT INTO public.gallery_views (gallery_id, visitor_id, ip_address, user_agent, referrer)
    VALUES (p_gallery_id, p_visitor_id, p_ip_address, p_user_agent, p_referrer);
    
    -- Upsert analytics
    INSERT INTO public.gallery_analytics (gallery_id, total_views, unique_views, first_view_at, last_view_at)
    VALUES (
        p_gallery_id, 
        1, 
        CASE WHEN v_is_new_visitor THEN 1 ELSE 0 END,
        NOW(),
        NOW()
    )
    ON CONFLICT (gallery_id) DO UPDATE SET
        total_views = gallery_analytics.total_views + 1,
        unique_views = gallery_analytics.unique_views + CASE WHEN v_is_new_visitor THEN 1 ELSE 0 END,
        first_view_at = COALESCE(gallery_analytics.first_view_at, NOW()),
        last_view_at = NOW(),
        updated_at = NOW();
    
    RETURN v_is_new_visitor;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a gallery download
CREATE OR REPLACE FUNCTION record_gallery_download(
    p_gallery_id UUID,
    p_visitor_id TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_download_type TEXT DEFAULT 'full',
    p_image_count INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_new_downloader BOOLEAN;
BEGIN
    -- Check if this visitor has downloaded before
    SELECT NOT EXISTS (
        SELECT 1 FROM public.gallery_downloads
        WHERE gallery_id = p_gallery_id 
        AND visitor_id = p_visitor_id
    ) INTO v_is_new_downloader;
    
    -- Insert the download event
    INSERT INTO public.gallery_downloads (gallery_id, visitor_id, ip_address, user_agent, download_type, image_count)
    VALUES (p_gallery_id, p_visitor_id, p_ip_address, p_user_agent, p_download_type, p_image_count);
    
    -- Upsert analytics
    INSERT INTO public.gallery_analytics (gallery_id, total_downloads, unique_downloads, first_download_at, last_download_at)
    VALUES (
        p_gallery_id, 
        1, 
        CASE WHEN v_is_new_downloader THEN 1 ELSE 0 END,
        NOW(),
        NOW()
    )
    ON CONFLICT (gallery_id) DO UPDATE SET
        total_downloads = gallery_analytics.total_downloads + 1,
        unique_downloads = gallery_analytics.unique_downloads + CASE WHEN v_is_new_downloader THEN 1 ELSE 0 END,
        first_download_at = COALESCE(gallery_analytics.first_download_at, NOW()),
        last_download_at = NOW(),
        updated_at = NOW();
    
    RETURN v_is_new_downloader;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get gallery analytics with recent activity
CREATE OR REPLACE FUNCTION get_gallery_analytics(p_gallery_id UUID)
RETURNS TABLE (
    total_views INTEGER,
    unique_views INTEGER,
    views_today INTEGER,
    views_this_week INTEGER,
    total_downloads INTEGER,
    unique_downloads INTEGER,
    downloads_today INTEGER,
    downloads_this_week INTEGER,
    first_view_at TIMESTAMPTZ,
    last_view_at TIMESTAMPTZ,
    first_download_at TIMESTAMPTZ,
    last_download_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ga.total_views, 0)::INTEGER,
        COALESCE(ga.unique_views, 0)::INTEGER,
        COALESCE((
            SELECT COUNT(*)::INTEGER FROM public.gallery_views gv 
            WHERE gv.gallery_id = p_gallery_id 
            AND gv.created_at > NOW() - INTERVAL '1 day'
        ), 0),
        COALESCE((
            SELECT COUNT(*)::INTEGER FROM public.gallery_views gv 
            WHERE gv.gallery_id = p_gallery_id 
            AND gv.created_at > NOW() - INTERVAL '7 days'
        ), 0),
        COALESCE(ga.total_downloads, 0)::INTEGER,
        COALESCE(ga.unique_downloads, 0)::INTEGER,
        COALESCE((
            SELECT COUNT(*)::INTEGER FROM public.gallery_downloads gd 
            WHERE gd.gallery_id = p_gallery_id 
            AND gd.created_at > NOW() - INTERVAL '1 day'
        ), 0),
        COALESCE((
            SELECT COUNT(*)::INTEGER FROM public.gallery_downloads gd 
            WHERE gd.gallery_id = p_gallery_id 
            AND gd.created_at > NOW() - INTERVAL '7 days'
        ), 0),
        ga.first_view_at,
        ga.last_view_at,
        ga.first_download_at,
        ga.last_download_at
    FROM public.gallery_analytics ga
    WHERE ga.gallery_id = p_gallery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.gallery_views IS 'Tracks individual gallery view events for analytics';
COMMENT ON TABLE public.gallery_downloads IS 'Tracks individual gallery download events';
COMMENT ON TABLE public.gallery_analytics IS 'Aggregated analytics per gallery for fast reads';
COMMENT ON FUNCTION record_gallery_view IS 'Records a view event with deduplication within 24h window';
COMMENT ON FUNCTION record_gallery_download IS 'Records a download event';
COMMENT ON FUNCTION get_gallery_analytics IS 'Returns comprehensive analytics for a gallery';
