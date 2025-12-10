-- Migration: Admin Galleries & Storage Intelligence System
-- Date: 2024-12-09
-- Purpose: God-mode admin control for galleries and storage analytics

-- ============================================================================
-- PART 1: GALLERY INTELLIGENCE
-- ============================================================================

-- Gallery analytics view with computed metrics
CREATE OR REPLACE VIEW admin_gallery_analytics AS
SELECT 
  g.id,
  g.title,
  g.slug,
  g.is_public,
  COALESCE(g.is_locked, false) as is_locked,
  g.created_at,
  g.updated_at,
  g.user_id,
  u.email as user_email,
  u.plan as user_plan,
  us.business_name as user_business_name,
  -- Image metrics
  COALESCE(img.image_count, 0) as image_count,
  COALESCE(img.total_bytes, 0) as total_bytes,
  COALESCE(img.avg_file_size, 0) as avg_file_size,
  img.first_image_path,
  img.last_upload_at,
  -- Engagement metrics
  COALESCE(el.email_count, 0) as emails_sent,
  COALESCE(el.open_count, 0) as email_opens,
  COALESCE(el.click_count, 0) as email_clicks,
  COALESCE(el.download_count, 0) as email_downloads,
  -- Computed scores
  CASE 
    WHEN COALESCE(img.image_count, 0) = 0 THEN 0
    WHEN u.plan = 'free' AND COALESCE(img.image_count, 0) > 50 THEN 90
    WHEN u.plan = 'free' AND COALESCE(el.email_count, 0) > 0 THEN 80
    WHEN u.plan = 'free' AND COALESCE(img.image_count, 0) > 20 THEN 70
    WHEN u.plan != 'free' THEN 50
    ELSE 30
  END as conversion_score,
  -- Age metrics
  EXTRACT(DAY FROM NOW() - g.created_at) as days_since_created,
  EXTRACT(DAY FROM NOW() - COALESCE(img.last_upload_at, g.created_at)) as days_since_activity
FROM galleries g
JOIN users u ON g.user_id = u.id
LEFT JOIN user_settings us ON u.id = us.user_id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as image_count,
    SUM(file_size_bytes) as total_bytes,
    AVG(file_size_bytes) as avg_file_size,
    MIN(storage_path) as first_image_path,
    MAX(created_at) as last_upload_at
  FROM images 
  WHERE gallery_id = g.id
) img ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as email_count,
    SUM(opened_count) as open_count,
    SUM(clicked_count) as click_count,
    SUM(download_count) as download_count
  FROM email_logs 
  WHERE gallery_id = g.id
) el ON true;

-- Function to search galleries with full-text search
CREATE OR REPLACE FUNCTION search_galleries_admin(
  search_query TEXT DEFAULT NULL,
  filter_user_id UUID DEFAULT NULL,
  filter_visibility TEXT DEFAULT NULL, -- 'public', 'private', 'all'
  filter_plan TEXT DEFAULT NULL,
  filter_min_images INTEGER DEFAULT NULL,
  filter_max_images INTEGER DEFAULT NULL,
  filter_min_storage BIGINT DEFAULT NULL,
  filter_max_storage BIGINT DEFAULT NULL,
  filter_date_from TIMESTAMPTZ DEFAULT NULL,
  filter_date_to TIMESTAMPTZ DEFAULT NULL,
  sort_by TEXT DEFAULT 'created_at',
  sort_order TEXT DEFAULT 'desc',
  page_num INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  is_public BOOLEAN,
  is_locked BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_id UUID,
  user_email TEXT,
  user_plan TEXT,
  user_business_name TEXT,
  image_count BIGINT,
  total_bytes BIGINT,
  emails_sent BIGINT,
  conversion_score INTEGER,
  days_since_created DOUBLE PRECISION,
  days_since_activity DOUBLE PRECISION,
  first_image_path TEXT,
  total_count BIGINT
) AS $$
DECLARE
  total BIGINT;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO total
  FROM admin_gallery_analytics aga
  WHERE 
    (search_query IS NULL OR 
      aga.title ILIKE '%' || search_query || '%' OR 
      aga.user_email ILIKE '%' || search_query || '%' OR
      aga.user_business_name ILIKE '%' || search_query || '%' OR
      aga.slug ILIKE '%' || search_query || '%')
    AND (filter_user_id IS NULL OR aga.user_id = filter_user_id)
    AND (filter_visibility IS NULL OR filter_visibility = 'all' OR 
      (filter_visibility = 'public' AND aga.is_public = true) OR
      (filter_visibility = 'private' AND aga.is_public = false))
    AND (filter_plan IS NULL OR aga.user_plan = filter_plan)
    AND (filter_min_images IS NULL OR aga.image_count >= filter_min_images)
    AND (filter_max_images IS NULL OR aga.image_count <= filter_max_images)
    AND (filter_min_storage IS NULL OR aga.total_bytes >= filter_min_storage)
    AND (filter_max_storage IS NULL OR aga.total_bytes <= filter_max_storage)
    AND (filter_date_from IS NULL OR aga.created_at >= filter_date_from)
    AND (filter_date_to IS NULL OR aga.created_at <= filter_date_to);

  RETURN QUERY
  SELECT 
    aga.id,
    aga.title,
    aga.slug,
    aga.is_public,
    aga.is_locked,
    aga.created_at,
    aga.updated_at,
    aga.user_id,
    aga.user_email,
    aga.user_plan,
    aga.user_business_name,
    aga.image_count,
    aga.total_bytes,
    aga.emails_sent,
    aga.conversion_score,
    aga.days_since_created,
    aga.days_since_activity,
    aga.first_image_path,
    total as total_count
  FROM admin_gallery_analytics aga
  WHERE 
    (search_query IS NULL OR 
      aga.title ILIKE '%' || search_query || '%' OR 
      aga.user_email ILIKE '%' || search_query || '%' OR
      aga.user_business_name ILIKE '%' || search_query || '%' OR
      aga.slug ILIKE '%' || search_query || '%')
    AND (filter_user_id IS NULL OR aga.user_id = filter_user_id)
    AND (filter_visibility IS NULL OR filter_visibility = 'all' OR 
      (filter_visibility = 'public' AND aga.is_public = true) OR
      (filter_visibility = 'private' AND aga.is_public = false))
    AND (filter_plan IS NULL OR aga.user_plan = filter_plan)
    AND (filter_min_images IS NULL OR aga.image_count >= filter_min_images)
    AND (filter_max_images IS NULL OR aga.image_count <= filter_max_images)
    AND (filter_min_storage IS NULL OR aga.total_bytes >= filter_min_storage)
    AND (filter_max_storage IS NULL OR aga.total_bytes <= filter_max_storage)
    AND (filter_date_from IS NULL OR aga.created_at >= filter_date_from)
    AND (filter_date_to IS NULL OR aga.created_at <= filter_date_to)
  ORDER BY
    CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN aga.created_at END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN aga.created_at END ASC,
    CASE WHEN sort_by = 'image_count' AND sort_order = 'desc' THEN aga.image_count END DESC,
    CASE WHEN sort_by = 'image_count' AND sort_order = 'asc' THEN aga.image_count END ASC,
    CASE WHEN sort_by = 'total_bytes' AND sort_order = 'desc' THEN aga.total_bytes END DESC,
    CASE WHEN sort_by = 'total_bytes' AND sort_order = 'asc' THEN aga.total_bytes END ASC,
    CASE WHEN sort_by = 'conversion_score' AND sort_order = 'desc' THEN aga.conversion_score END DESC,
    CASE WHEN sort_by = 'conversion_score' AND sort_order = 'asc' THEN aga.conversion_score END ASC,
    CASE WHEN sort_by = 'title' AND sort_order = 'asc' THEN aga.title END ASC,
    CASE WHEN sort_by = 'title' AND sort_order = 'desc' THEN aga.title END DESC,
    aga.created_at DESC
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: STORAGE INTELLIGENCE
-- ============================================================================

-- User storage analytics view
CREATE OR REPLACE VIEW admin_user_storage AS
SELECT 
  u.id as user_id,
  u.email,
  u.plan,
  u.created_at as user_created_at,
  us.business_name,
  -- Gallery metrics
  COALESCE(g.gallery_count, 0) as gallery_count,
  COALESCE(g.total_images, 0) as total_images,
  COALESCE(g.total_bytes, 0) as total_bytes,
  -- Plan limits
  CASE u.plan
    WHEN 'free' THEN 2147483648 -- 2GB
    WHEN 'essential' THEN 10737418240 -- 10GB
    WHEN 'pro' THEN 53687091200 -- 50GB
    WHEN 'studio' THEN 107374182400 -- 100GB
    WHEN 'elite' THEN 268435456000 -- 250GB
    ELSE 2147483648
  END as storage_limit,
  -- Computed metrics
  ROUND(
    COALESCE(g.total_bytes, 0)::NUMERIC / 
    NULLIF(CASE u.plan
      WHEN 'free' THEN 2147483648
      WHEN 'essential' THEN 10737418240
      WHEN 'pro' THEN 53687091200
      WHEN 'studio' THEN 107374182400
      WHEN 'elite' THEN 268435456000
      ELSE 2147483648
    END, 0) * 100, 2
  ) as storage_percent,
  -- Activity
  g.last_upload_at,
  EXTRACT(DAY FROM NOW() - COALESCE(g.last_upload_at, u.created_at)) as days_since_upload
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT gal.id) as gallery_count,
    COUNT(img.id) as total_images,
    COALESCE(SUM(img.file_size_bytes), 0) as total_bytes,
    MAX(img.created_at) as last_upload_at
  FROM galleries gal
  LEFT JOIN images img ON gal.id = img.gallery_id
  WHERE gal.user_id = u.id
) g ON true;

-- Platform storage summary function
CREATE OR REPLACE FUNCTION get_platform_storage_summary()
RETURNS TABLE (
  total_users BIGINT,
  total_galleries BIGINT,
  total_images BIGINT,
  total_bytes BIGINT,
  avg_bytes_per_user BIGINT,
  avg_bytes_per_gallery BIGINT,
  avg_images_per_gallery NUMERIC,
  users_over_80_percent BIGINT,
  users_over_90_percent BIGINT,
  free_tier_bytes BIGINT,
  paid_tier_bytes BIGINT,
  storage_by_plan JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_storage AS (
    SELECT * FROM admin_user_storage
  ),
  plan_breakdown AS (
    SELECT 
      plan,
      COUNT(*) as user_count,
      SUM(total_bytes) as bytes
    FROM user_storage
    GROUP BY plan
  )
  SELECT 
    (SELECT COUNT(*) FROM users)::BIGINT,
    (SELECT COUNT(*) FROM galleries)::BIGINT,
    (SELECT COUNT(*) FROM images)::BIGINT,
    COALESCE(SUM(us.total_bytes), 0)::BIGINT,
    COALESCE(AVG(us.total_bytes), 0)::BIGINT,
    COALESCE((SELECT AVG(total_bytes) FROM admin_gallery_analytics), 0)::BIGINT,
    COALESCE((SELECT AVG(image_count) FROM admin_gallery_analytics), 0)::NUMERIC,
    (SELECT COUNT(*) FROM user_storage WHERE storage_percent >= 80)::BIGINT,
    (SELECT COUNT(*) FROM user_storage WHERE storage_percent >= 90)::BIGINT,
    COALESCE((SELECT SUM(total_bytes) FROM user_storage WHERE plan = 'free'), 0)::BIGINT,
    COALESCE((SELECT SUM(total_bytes) FROM user_storage WHERE plan != 'free'), 0)::BIGINT,
    (SELECT jsonb_agg(jsonb_build_object('plan', plan, 'users', user_count, 'bytes', bytes)) FROM plan_breakdown)
  FROM user_storage us;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Top storage users function
CREATE OR REPLACE FUNCTION get_top_storage_users(
  limit_count INTEGER DEFAULT 50,
  min_percent NUMERIC DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  plan TEXT,
  business_name TEXT,
  gallery_count BIGINT,
  total_images BIGINT,
  total_bytes BIGINT,
  storage_limit BIGINT,
  storage_percent NUMERIC,
  days_since_upload DOUBLE PRECISION,
  upgrade_potential TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aus.user_id,
    aus.email,
    aus.plan,
    aus.business_name,
    aus.gallery_count,
    aus.total_images,
    aus.total_bytes,
    aus.storage_limit,
    aus.storage_percent,
    aus.days_since_upload,
    CASE 
      WHEN aus.plan = 'free' AND aus.storage_percent >= 80 THEN 'HOT'
      WHEN aus.plan = 'free' AND aus.storage_percent >= 50 THEN 'WARM'
      WHEN aus.plan = 'essential' AND aus.storage_percent >= 80 THEN 'UPGRADE_PRO'
      WHEN aus.plan = 'pro' AND aus.storage_percent >= 80 THEN 'UPGRADE_STUDIO'
      ELSE 'NONE'
    END as upgrade_potential
  FROM admin_user_storage aus
  WHERE aus.storage_percent >= min_percent
  ORDER BY aus.total_bytes DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage growth tracking table
CREATE TABLE IF NOT EXISTS storage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_bytes BIGINT NOT NULL,
  total_images BIGINT NOT NULL,
  total_galleries BIGINT NOT NULL,
  total_users BIGINT NOT NULL,
  free_tier_bytes BIGINT NOT NULL,
  paid_tier_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_date)
);

-- Function to capture daily storage snapshot
CREATE OR REPLACE FUNCTION capture_storage_snapshot()
RETURNS void AS $$
DECLARE
  summary RECORD;
BEGIN
  SELECT * INTO summary FROM get_platform_storage_summary();
  
  INSERT INTO storage_snapshots (
    snapshot_date,
    total_bytes,
    total_images,
    total_galleries,
    total_users,
    free_tier_bytes,
    paid_tier_bytes
  ) VALUES (
    CURRENT_DATE,
    summary.total_bytes,
    summary.total_images,
    summary.total_galleries,
    summary.total_users,
    summary.free_tier_bytes,
    summary.paid_tier_bytes
  )
  ON CONFLICT (snapshot_date) DO UPDATE SET
    total_bytes = EXCLUDED.total_bytes,
    total_images = EXCLUDED.total_images,
    total_galleries = EXCLUDED.total_galleries,
    total_users = EXCLUDED.total_users,
    free_tier_bytes = EXCLUDED.free_tier_bytes,
    paid_tier_bytes = EXCLUDED.paid_tier_bytes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get storage growth data
CREATE OR REPLACE FUNCTION get_storage_growth(days INTEGER DEFAULT 30)
RETURNS TABLE (
  snapshot_date DATE,
  total_bytes BIGINT,
  total_images BIGINT,
  total_galleries BIGINT,
  total_users BIGINT,
  daily_growth_bytes BIGINT,
  daily_growth_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.snapshot_date,
    ss.total_bytes,
    ss.total_images,
    ss.total_galleries,
    ss.total_users,
    (ss.total_bytes - LAG(ss.total_bytes) OVER (ORDER BY ss.snapshot_date))::BIGINT as daily_growth_bytes,
    ROUND(
      ((ss.total_bytes - LAG(ss.total_bytes) OVER (ORDER BY ss.snapshot_date))::NUMERIC / 
      NULLIF(LAG(ss.total_bytes) OVER (ORDER BY ss.snapshot_date), 0)) * 100, 2
    ) as daily_growth_percent
  FROM storage_snapshots ss
  WHERE ss.snapshot_date >= CURRENT_DATE - days
  ORDER BY ss.snapshot_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: CONVERSION INTELLIGENCE
-- ============================================================================

-- Conversion events tracking
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'storage_warning', 'gallery_limit', 'feature_gate', 'upgrade_prompt'
  event_data JSONB DEFAULT '{}',
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ, -- When they actually upgraded
  converted_to_plan TEXT,
  attribution_source TEXT -- What triggered the conversion
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_user ON conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON conversion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_triggered ON conversion_events(triggered_at);

-- Function to log conversion event
CREATE OR REPLACE FUNCTION log_conversion_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO conversion_events (user_id, event_type, event_data)
  VALUES (p_user_id, p_event_type, p_event_data)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get users ready for conversion outreach
CREATE OR REPLACE FUNCTION get_conversion_candidates(
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  plan TEXT,
  business_name TEXT,
  storage_percent NUMERIC,
  gallery_count BIGINT,
  total_images BIGINT,
  days_active DOUBLE PRECISION,
  conversion_score INTEGER,
  recommended_action TEXT,
  recommended_plan TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_metrics AS (
    SELECT 
      aus.user_id,
      aus.email,
      aus.plan,
      aus.business_name,
      aus.storage_percent,
      aus.gallery_count,
      aus.total_images,
      EXTRACT(DAY FROM NOW() - aus.user_created_at) as days_active,
      -- Conversion score calculation
      (
        CASE WHEN aus.storage_percent >= 80 THEN 40 ELSE aus.storage_percent::INTEGER / 2 END +
        CASE WHEN aus.gallery_count >= 5 THEN 30 WHEN aus.gallery_count >= 3 THEN 20 ELSE aus.gallery_count::INTEGER * 5 END +
        CASE WHEN aus.total_images >= 100 THEN 30 WHEN aus.total_images >= 50 THEN 20 ELSE aus.total_images::INTEGER / 5 END
      ) as score
    FROM admin_user_storage aus
    WHERE aus.plan = 'free'
      AND aus.total_images > 0
  )
  SELECT 
    um.user_id,
    um.email,
    um.plan,
    um.business_name,
    um.storage_percent,
    um.gallery_count,
    um.total_images,
    um.days_active,
    um.score as conversion_score,
    CASE 
      WHEN um.storage_percent >= 80 THEN 'STORAGE_UPGRADE_EMAIL'
      WHEN um.gallery_count >= 5 THEN 'FEATURE_UPGRADE_EMAIL'
      WHEN um.days_active >= 14 AND um.total_images >= 20 THEN 'ENGAGEMENT_UPGRADE_EMAIL'
      ELSE 'NURTURE_SEQUENCE'
    END as recommended_action,
    CASE 
      WHEN um.storage_percent >= 80 OR um.gallery_count >= 10 THEN 'pro'
      ELSE 'essential'
    END as recommended_plan
  FROM user_metrics um
  WHERE um.score >= 30
  ORDER BY um.score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 4: ADMIN GALLERY ACTIONS
-- ============================================================================

-- Transfer gallery ownership
CREATE OR REPLACE FUNCTION admin_transfer_gallery(
  p_gallery_id UUID,
  p_new_owner_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  old_owner_id UUID;
  gallery_title TEXT;
BEGIN
  -- Get current owner
  SELECT user_id, title INTO old_owner_id, gallery_title
  FROM galleries WHERE id = p_gallery_id;
  
  IF old_owner_id IS NULL THEN
    RAISE EXCEPTION 'Gallery not found';
  END IF;
  
  -- Transfer ownership
  UPDATE galleries SET user_id = p_new_owner_id, updated_at = NOW()
  WHERE id = p_gallery_id;
  
  -- Log to audit
  INSERT INTO admin_audit_logs (
    admin_id, 
    action, 
    target_type, 
    target_id, 
    target_identifier,
    metadata
  ) VALUES (
    p_admin_id,
    'gallery.transfer',
    'gallery',
    p_gallery_id,
    gallery_title,
    jsonb_build_object(
      'old_owner_id', old_owner_id,
      'new_owner_id', p_new_owner_id
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk delete galleries
CREATE OR REPLACE FUNCTION admin_delete_galleries(
  p_gallery_ids UUID[],
  p_admin_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  gallery_record RECORD;
BEGIN
  deleted_count := 0;
  
  FOR gallery_record IN 
    SELECT id, title, user_id FROM galleries WHERE id = ANY(p_gallery_ids)
  LOOP
    -- Log each deletion
    INSERT INTO admin_audit_logs (
      admin_id, 
      action, 
      target_type, 
      target_id, 
      target_identifier,
      metadata
    ) VALUES (
      p_admin_id,
      'gallery.delete',
      'gallery',
      gallery_record.id,
      gallery_record.title,
      jsonb_build_object('user_id', gallery_record.user_id)
    );
    
    deleted_count := deleted_count + 1;
  END LOOP;
  
  -- Delete galleries (images cascade)
  DELETE FROM galleries WHERE id = ANY(p_gallery_ids);
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON VIEW admin_gallery_analytics IS 'Comprehensive gallery analytics for admin dashboard';
COMMENT ON VIEW admin_user_storage IS 'User storage metrics for admin dashboard';
COMMENT ON TABLE storage_snapshots IS 'Daily storage metrics snapshots for trend analysis';
COMMENT ON TABLE conversion_events IS 'Tracks conversion-related events for analytics';
COMMENT ON FUNCTION search_galleries_admin IS 'Advanced gallery search with filters and pagination';
COMMENT ON FUNCTION get_platform_storage_summary IS 'Platform-wide storage statistics';
COMMENT ON FUNCTION get_top_storage_users IS 'Top users by storage consumption';
COMMENT ON FUNCTION get_conversion_candidates IS 'Users most likely to convert to paid';
