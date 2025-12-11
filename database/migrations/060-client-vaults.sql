-- Client Photo Vault System
-- Allows clients to pay for long-term storage of their photos after gallery expiry

-- ============================================
-- VAULT PLANS
-- ============================================
-- Stores available vault subscription plans
CREATE TABLE IF NOT EXISTS vault_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,                           -- 'Vault' or 'Vault+'
  storage_gb INTEGER NOT NULL,                  -- 50 or 200
  monthly_price_cents INTEGER NOT NULL,         -- 400 or 800
  annual_price_cents INTEGER NOT NULL,          -- 3900 or 7900
  stripe_monthly_price_id TEXT,                 -- Stripe price ID for monthly
  stripe_annual_price_id TEXT,                  -- Stripe price ID for annual
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default vault plans
INSERT INTO vault_plans (id, name, storage_gb, monthly_price_cents, annual_price_cents)
VALUES 
  ('vault', 'Vault', 50, 400, 3900),
  ('vault_plus', 'Vault+', 200, 800, 7900)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CLIENT VAULTS
-- ============================================
-- Tracks vault subscriptions for clients
CREATE TABLE IF NOT EXISTS client_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Client identification (can be email-based, not requiring full account)
  client_email TEXT NOT NULL,
  client_name TEXT,
  
  -- Link to photographer who originally shared the gallery
  photographer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Link to original gallery (if still exists)
  original_gallery_id UUID REFERENCES galleries(id) ON DELETE SET NULL,
  
  -- Vault plan
  vault_plan_id TEXT NOT NULL REFERENCES vault_plans(id),
  
  -- Subscription details
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'expired')),
  billing_period TEXT DEFAULT 'annual' CHECK (billing_period IN ('monthly', 'annual')),
  
  -- Storage tracking
  storage_used_bytes BIGINT DEFAULT 0,
  storage_limit_bytes BIGINT NOT NULL,
  image_count INTEGER DEFAULT 0,
  
  -- Dates
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                       -- When subscription ends
  canceled_at TIMESTAMPTZ,
  
  -- Access token for client to view their vault
  access_token_hash TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_client_vaults_email ON client_vaults(client_email);
CREATE INDEX IF NOT EXISTS idx_client_vaults_photographer ON client_vaults(photographer_id);
CREATE INDEX IF NOT EXISTS idx_client_vaults_status ON client_vaults(subscription_status);
CREATE INDEX IF NOT EXISTS idx_client_vaults_stripe_sub ON client_vaults(stripe_subscription_id);

-- ============================================
-- VAULT IMAGES
-- ============================================
-- Images stored in client vaults (copied from original gallery)
CREATE TABLE IF NOT EXISTS vault_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES client_vaults(id) ON DELETE CASCADE,
  
  -- Storage info
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Dimensions
  width INTEGER,
  height INTEGER,
  
  -- Reference to original image (if still exists)
  original_image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  
  -- Position for ordering
  position INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_images_vault ON vault_images(vault_id);

-- ============================================
-- VAULT ACCESS TOKENS
-- ============================================
-- Secure access tokens for clients to view their vault
CREATE TABLE IF NOT EXISTS vault_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES client_vaults(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,
  
  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_tokens_hash ON vault_access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_vault_tokens_vault ON vault_access_tokens(vault_id);

-- ============================================
-- VAULT INVITATIONS
-- ============================================
-- Tracks when photographers invite clients to purchase vault storage
CREATE TABLE IF NOT EXISTS vault_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  client_email TEXT NOT NULL,
  client_name TEXT,
  
  -- Invitation status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'clicked', 'purchased', 'expired')),
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,
  
  -- The vault created if purchased
  vault_id UUID REFERENCES client_vaults(id) ON DELETE SET NULL,
  
  -- Secure token for purchase link
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_invitations_gallery ON vault_invitations(gallery_id);
CREATE INDEX IF NOT EXISTS idx_vault_invitations_token ON vault_invitations(token_hash);

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Create a dedicated bucket for vault storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-vaults',
  'client-vaults',
  false,
  52428800, -- 50MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for vault bucket
CREATE POLICY "Vault images are private"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-vaults');

-- ============================================
-- HELPER FUNCTION
-- ============================================
-- Calculate vault storage usage
CREATE OR REPLACE FUNCTION calculate_vault_storage(p_vault_id UUID)
RETURNS TABLE (
  total_bytes BIGINT,
  image_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(file_size_bytes), 0)::BIGINT as total_bytes,
    COUNT(*)::INTEGER as image_count
  FROM vault_images
  WHERE vault_id = p_vault_id;
END;
$$ LANGUAGE plpgsql;

-- Update vault storage on image changes
CREATE OR REPLACE FUNCTION update_vault_storage()
RETURNS TRIGGER AS $$
DECLARE
  v_total_bytes BIGINT;
  v_image_count INTEGER;
BEGIN
  -- Get the vault_id depending on operation
  IF TG_OP = 'DELETE' THEN
    SELECT total_bytes, image_count INTO v_total_bytes, v_image_count
    FROM calculate_vault_storage(OLD.vault_id);
    
    UPDATE client_vaults 
    SET storage_used_bytes = v_total_bytes,
        image_count = v_image_count,
        updated_at = NOW()
    WHERE id = OLD.vault_id;
  ELSE
    SELECT total_bytes, image_count INTO v_total_bytes, v_image_count
    FROM calculate_vault_storage(NEW.vault_id);
    
    UPDATE client_vaults 
    SET storage_used_bytes = v_total_bytes,
        image_count = v_image_count,
        updated_at = NOW()
    WHERE id = NEW.vault_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update storage on vault_images changes
DROP TRIGGER IF EXISTS trigger_update_vault_storage ON vault_images;
CREATE TRIGGER trigger_update_vault_storage
AFTER INSERT OR UPDATE OR DELETE ON vault_images
FOR EACH ROW EXECUTE FUNCTION update_vault_storage();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE vault_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_invitations ENABLE ROW LEVEL SECURITY;

-- Vault plans are readable by all
CREATE POLICY "Vault plans are public" ON vault_plans FOR SELECT USING (true);

-- Client vaults - photographers can see vaults they created
CREATE POLICY "Photographers can view their client vaults" ON client_vaults
FOR SELECT USING (photographer_id IN (
  SELECT id FROM users WHERE clerk_id = auth.uid()::text
));

-- Vault images - photographers can view images in their client vaults
CREATE POLICY "Photographers can view vault images" ON vault_images
FOR SELECT USING (vault_id IN (
  SELECT cv.id FROM client_vaults cv
  JOIN users u ON cv.photographer_id = u.id
  WHERE u.clerk_id = auth.uid()::text
));

-- Vault invitations - photographers can manage their invitations
CREATE POLICY "Photographers can manage vault invitations" ON vault_invitations
FOR ALL USING (photographer_id IN (
  SELECT id FROM users WHERE clerk_id = auth.uid()::text
));
