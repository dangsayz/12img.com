-- ============================================================================
-- PROMOTIONAL DEALS SYSTEM
-- ============================================================================
-- Admin-controlled promotional campaigns with landing page integration
-- ============================================================================

-- Promotional campaigns table
CREATE TABLE promotional_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Limits
  max_redemptions INTEGER, -- NULL = unlimited
  current_redemptions INTEGER DEFAULT 0,
  
  -- Targeting
  target_plans TEXT[] DEFAULT ARRAY['essential', 'pro', 'studio', 'elite'],
  new_users_only BOOLEAN DEFAULT false,
  
  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'price_override')),
  discount_value INTEGER NOT NULL, -- Percent (0-100) or cents for fixed/override
  discount_duration TEXT DEFAULT 'once' CHECK (discount_duration IN ('once', 'forever', 'repeating')),
  discount_months INTEGER, -- For repeating duration
  
  -- Stripe integration
  stripe_coupon_id TEXT,
  stripe_price_ids JSONB DEFAULT '{}', -- { "pro": "price_xxx", "studio": "price_yyy" }
  
  -- Display - Banner
  badge_text TEXT, -- "50% OFF", "FOUNDER PRICING", "LIMITED"
  banner_headline TEXT NOT NULL,
  banner_subheadline TEXT,
  banner_cta TEXT DEFAULT 'Claim Deal',
  banner_bg_color TEXT DEFAULT '#141414',
  banner_text_color TEXT DEFAULT '#FFFFFF',
  banner_accent_color TEXT DEFAULT '#10B981', -- Emerald for highlights
  
  -- Display - Options
  show_countdown BOOLEAN DEFAULT true,
  show_spots_remaining BOOLEAN DEFAULT false,
  show_original_price BOOLEAN DEFAULT true,
  
  -- Landing page integration
  show_on_landing BOOLEAN DEFAULT true,
  show_on_pricing BOOLEAN DEFAULT true,
  landing_position TEXT DEFAULT 'floating' CHECK (landing_position IN ('hero', 'above_pricing', 'floating', 'none')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Only one can be featured at a time
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign redemptions tracking
CREATE TABLE campaign_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  email TEXT, -- For tracking before user exists
  
  -- What they got
  plan TEXT NOT NULL,
  original_price INTEGER NOT NULL, -- In cents
  discounted_price INTEGER NOT NULL, -- In cents
  amount_saved INTEGER NOT NULL, -- In cents
  
  -- Stripe
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,
  
  -- Tracking
  promo_link_id UUID, -- Which link they came from
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, user_id)
);

-- Shareable promo links with tracking
CREATE TABLE promo_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  
  -- Link identity
  code TEXT UNIQUE NOT NULL, -- Short code: "FOUNDER100", "BF2025-IG"
  name TEXT, -- "Instagram Bio", "Email Newsletter"
  
  -- UTM parameters
  utm_source TEXT, -- instagram, twitter, email, etc.
  utm_medium TEXT, -- bio, post, newsletter, etc.
  utm_campaign TEXT, -- launch, blackfriday, etc.
  
  -- Stats
  clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Optional expiry separate from campaign
);

-- Click tracking for promo links
CREATE TABLE promo_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES promo_links(id) ON DELETE CASCADE,
  
  -- Visitor info (anonymized)
  visitor_hash TEXT, -- Hash of IP + UA for unique counting
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_campaigns_active ON promotional_campaigns(is_active, starts_at, ends_at);
CREATE INDEX idx_campaigns_slug ON promotional_campaigns(slug);
CREATE INDEX idx_campaigns_featured ON promotional_campaigns(is_featured) WHERE is_featured = true;

CREATE INDEX idx_redemptions_campaign ON campaign_redemptions(campaign_id);
CREATE INDEX idx_redemptions_user ON campaign_redemptions(user_id);
CREATE INDEX idx_redemptions_date ON campaign_redemptions(redeemed_at);

CREATE INDEX idx_promo_links_code ON promo_links(code);
CREATE INDEX idx_promo_links_campaign ON promo_links(campaign_id);

CREATE INDEX idx_link_clicks_link ON promo_link_clicks(link_id);
CREATE INDEX idx_link_clicks_date ON promo_link_clicks(clicked_at);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get the currently active campaign (prioritizes scarcity, then discount size)
CREATE OR REPLACE FUNCTION get_active_campaign()
RETURNS promotional_campaigns AS $$
  SELECT * FROM promotional_campaigns
  WHERE is_active = true
    AND NOW() >= starts_at
    AND NOW() <= ends_at
    AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)
  ORDER BY 
    is_featured DESC, -- Featured first
    CASE WHEN max_redemptions IS NOT NULL THEN 0 ELSE 1 END, -- Then scarcity
    discount_value DESC -- Then biggest discount
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Get campaign by slug (for promo pages)
CREATE OR REPLACE FUNCTION get_campaign_by_slug(campaign_slug TEXT)
RETURNS promotional_campaigns AS $$
  SELECT * FROM promotional_campaigns
  WHERE slug = campaign_slug
    AND is_active = true
    AND NOW() >= starts_at
    AND NOW() <= ends_at
    AND (max_redemptions IS NULL OR current_redemptions < max_redemptions);
$$ LANGUAGE sql STABLE;

-- Increment redemption count
CREATE OR REPLACE FUNCTION increment_campaign_redemption(campaign_slug TEXT)
RETURNS void AS $$
  UPDATE promotional_campaigns
  SET current_redemptions = current_redemptions + 1,
      updated_at = NOW()
  WHERE slug = campaign_slug;
$$ LANGUAGE sql;

-- Record a promo link click
CREATE OR REPLACE FUNCTION record_promo_click(
  link_code TEXT,
  p_visitor_hash TEXT,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_link_id UUID;
  v_is_unique BOOLEAN;
BEGIN
  -- Get link ID
  SELECT id INTO v_link_id FROM promo_links WHERE code = link_code;
  IF v_link_id IS NULL THEN RETURN; END IF;
  
  -- Check if unique visitor
  SELECT NOT EXISTS(
    SELECT 1 FROM promo_link_clicks 
    WHERE link_id = v_link_id AND visitor_hash = p_visitor_hash
  ) INTO v_is_unique;
  
  -- Insert click record
  INSERT INTO promo_link_clicks (link_id, visitor_hash, referrer, user_agent, country)
  VALUES (v_link_id, p_visitor_hash, p_referrer, p_user_agent, p_country);
  
  -- Update link stats
  UPDATE promo_links
  SET clicks = clicks + 1,
      unique_clicks = unique_clicks + CASE WHEN v_is_unique THEN 1 ELSE 0 END
  WHERE id = v_link_id;
END;
$$ LANGUAGE plpgsql;

-- Get campaign stats
CREATE OR REPLACE FUNCTION get_campaign_stats(campaign_id_param UUID)
RETURNS TABLE (
  total_redemptions INTEGER,
  total_revenue_cents BIGINT,
  total_savings_cents BIGINT,
  conversion_rate NUMERIC,
  top_plan TEXT,
  avg_order_value INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*)::INTEGER as redemptions,
      COALESCE(SUM(discounted_price), 0) as revenue,
      COALESCE(SUM(amount_saved), 0) as savings,
      MODE() WITHIN GROUP (ORDER BY plan) as popular_plan,
      COALESCE(AVG(discounted_price), 0)::INTEGER as aov
    FROM campaign_redemptions
    WHERE campaign_id = campaign_id_param
  ),
  clicks AS (
    SELECT COALESCE(SUM(unique_clicks), 0) as total_clicks
    FROM promo_links
    WHERE campaign_id = campaign_id_param
  )
  SELECT 
    s.redemptions,
    s.revenue,
    s.savings,
    CASE WHEN c.total_clicks > 0 
      THEN ROUND((s.redemptions::NUMERIC / c.total_clicks) * 100, 2)
      ELSE 0 
    END,
    s.popular_plan,
    s.aov
  FROM stats s, clicks c;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_link_clicks ENABLE ROW LEVEL SECURITY;

-- Public can read active campaigns (for landing page)
CREATE POLICY "Anyone can view active campaigns"
  ON promotional_campaigns FOR SELECT
  USING (
    is_active = true 
    AND NOW() >= starts_at 
    AND NOW() <= ends_at
    AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)
  );

-- Admins can manage everything
CREATE POLICY "Admins can manage campaigns"
  ON promotional_campaigns FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view redemptions"
  ON campaign_redemptions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert redemptions"
  ON campaign_redemptions FOR INSERT
  WITH CHECK (true); -- Controlled by server

CREATE POLICY "Admins can manage promo links"
  ON promo_links FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Public can view active promo links"
  ON promo_links FOR SELECT
  USING (is_active = true);

CREATE POLICY "System can insert clicks"
  ON promo_link_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view clicks"
  ON promo_link_clicks FOR SELECT
  USING (is_admin(auth.uid()));

-- ============================================================================
-- SEED: FOUNDER'S 100 CAMPAIGN
-- ============================================================================

INSERT INTO promotional_campaigns (
  slug,
  name,
  description,
  starts_at,
  ends_at,
  max_redemptions,
  target_plans,
  new_users_only,
  discount_type,
  discount_value,
  discount_duration,
  stripe_coupon_id,
  badge_text,
  banner_headline,
  banner_subheadline,
  banner_cta,
  banner_bg_color,
  banner_text_color,
  banner_accent_color,
  show_countdown,
  show_spots_remaining,
  show_original_price,
  show_on_landing,
  show_on_pricing,
  landing_position,
  is_active,
  is_featured
) VALUES (
  'founder100',
  'Founder''s 100',
  'First 100 photographers get Elite tier for $30/year instead of $449. Lifetime founder status.',
  NOW(),
  NOW() + INTERVAL '90 days',
  100,
  ARRAY['elite'],
  true,
  'price_override',
  3000, -- $30.00 in cents
  'once', -- First year only
  'FOUNDER100', -- Create this in Stripe
  'FOUNDER PRICING',
  'First 100 get Elite for $30/year',
  '2TB storage. Unlimited galleries. Unlimited contracts. Lock in 44% off.',
  'Claim Your Spot',
  '#141414',
  '#FFFFFF',
  '#10B981',
  false, -- No countdown (scarcity-based)
  true,  -- Show spots remaining
  true,  -- Show original price crossed out
  true,
  true,
  'floating',
  true,
  true
);

-- Create default promo link for founder campaign
INSERT INTO promo_links (
  campaign_id,
  code,
  name,
  utm_source,
  utm_medium,
  utm_campaign
)
SELECT 
  id,
  'FOUNDER100',
  'Main Link',
  'direct',
  'link',
  'founder_launch'
FROM promotional_campaigns WHERE slug = 'founder100';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE promotional_campaigns IS 'Admin-controlled promotional campaigns with landing page integration';
COMMENT ON TABLE campaign_redemptions IS 'Tracks who redeemed which promo and what they saved';
COMMENT ON TABLE promo_links IS 'Shareable links with UTM tracking for each campaign';
COMMENT ON TABLE promo_link_clicks IS 'Click tracking for conversion funnel analysis';

COMMENT ON COLUMN promotional_campaigns.discount_type IS 'percent = X% off, fixed = $X off, price_override = exact price in cents';
COMMENT ON COLUMN promotional_campaigns.discount_duration IS 'once = first payment, forever = all payments, repeating = X months';
COMMENT ON COLUMN promotional_campaigns.landing_position IS 'hero = top of page, above_pricing = before pricing section, floating = fixed banner, none = hidden';
