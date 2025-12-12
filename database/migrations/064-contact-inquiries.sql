-- Contact Inquiries
-- Stores contact form submissions from public profile visitors
-- Enables visitors to reach out to photographers without being existing clients

-- ==============================================
-- CONTACT INQUIRIES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Sender info
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  
  -- Inquiry details
  subject VARCHAR(200),
  message TEXT NOT NULL,
  event_type VARCHAR(50), -- wedding, portrait, event, etc.
  event_date DATE,
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'profile', -- profile, website, etc.
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_contact_inquiries_photographer ON contact_inquiries(photographer_id);
CREATE INDEX idx_contact_inquiries_status ON contact_inquiries(photographer_id, status);
CREATE INDEX idx_contact_inquiries_created ON contact_inquiries(photographer_id, created_at DESC);
CREATE INDEX idx_contact_inquiries_email ON contact_inquiries(email);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_contact_inquiry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_inquiries_updated_at
  BEFORE UPDATE ON contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_inquiry_timestamp();

-- RLS Policies
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Photographers can view their own inquiries
CREATE POLICY contact_inquiries_select ON contact_inquiries
  FOR SELECT
  USING (photographer_id IN (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  ));

-- Photographers can update their own inquiries (mark as read, etc.)
CREATE POLICY contact_inquiries_update ON contact_inquiries
  FOR UPDATE
  USING (photographer_id IN (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  ));

-- Anyone can insert (public form submission)
CREATE POLICY contact_inquiries_insert ON contact_inquiries
  FOR INSERT
  WITH CHECK (true);

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE contact_inquiries IS 'Contact form submissions from public profile visitors';
COMMENT ON COLUMN contact_inquiries.photographer_id IS 'The photographer receiving the inquiry';
COMMENT ON COLUMN contact_inquiries.status IS 'Inquiry status: new, read, replied, archived';
COMMENT ON COLUMN contact_inquiries.source IS 'Where the inquiry came from (profile, website, etc.)';
