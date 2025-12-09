-- Feature Requests Table
-- Stores feature requests submitted from the landing page

CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  request TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'planned', 'shipped', 'declined')),
  admin_notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);

-- RLS policies
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit feature requests"
  ON feature_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read/update
CREATE POLICY "Admins can view all feature requests"
  ON feature_requests FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update feature requests"
  ON feature_requests FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_feature_requests_updated_at
  BEFORE UPDATE ON feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
