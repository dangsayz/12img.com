-- ============================================================================
-- COMMUNITY SPOTLIGHT SYSTEM
-- Monthly photo-voting contest for 12img
-- ============================================================================
-- 
-- This migration creates the contest, entries, and votes tables for the
-- Community Spotlight feature. Photographers can submit photos, and the
-- community votes to select a monthly winner.
--
-- TABLES:
--   contests        - Monthly contest definitions
--   contest_entries - Photo submissions to contests
--   contest_votes   - User votes on entries
--
-- RUN: Execute this in Supabase SQL Editor
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM: Contest Status
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE contest_status AS ENUM (
    'draft',              -- Admin is setting up
    'submissions_open',   -- Accepting photo submissions
    'voting',             -- Voting in progress
    'finished',           -- Winner selected
    'cancelled'           -- Contest cancelled
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: contests
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contest info
  name TEXT NOT NULL,
  theme TEXT,
  description TEXT,
  cover_image_url TEXT,
  
  -- Timing windows
  submission_starts_at TIMESTAMPTZ NOT NULL,
  submission_ends_at TIMESTAMPTZ NOT NULL,
  voting_starts_at TIMESTAMPTZ NOT NULL,
  voting_ends_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  status contest_status NOT NULL DEFAULT 'draft',
  
  -- Settings
  max_entries_per_user INT NOT NULL DEFAULT 1,
  max_votes_per_user INT NOT NULL DEFAULT 3,
  show_vote_counts BOOLEAN NOT NULL DEFAULT false,
  require_approval BOOLEAN NOT NULL DEFAULT true,
  min_account_age_days INT NOT NULL DEFAULT 0,  -- 0 = no restriction
  
  -- Winner (set when contest finishes)
  winner_entry_id UUID,  -- FK added after contest_entries table
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: contest_entries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Approval workflow
  approved BOOLEAN NOT NULL DEFAULT false,
  rejected BOOLEAN NOT NULL DEFAULT false,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Cached vote count (updated by trigger for performance)
  vote_count INT NOT NULL DEFAULT 0,
  
  -- Submission metadata
  caption TEXT,  -- Optional caption for the entry
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(contest_id, image_id),  -- Same photo can't be submitted twice
  UNIQUE(contest_id, user_id)    -- One entry per user per contest (if max_entries_per_user = 1)
);

-- Add FK from contests to contest_entries for winner
ALTER TABLE contests 
  ADD CONSTRAINT fk_winner_entry 
  FOREIGN KEY (winner_entry_id) 
  REFERENCES contest_entries(id) 
  ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: contest_votes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contest_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES contest_entries(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One vote per user per entry
  UNIQUE(contest_id, entry_id, voter_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Fast lookup of active contest
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_voting_ends ON contests(voting_ends_at) WHERE status = 'voting';

-- Fast lookup of entries by contest
CREATE INDEX IF NOT EXISTS idx_entries_contest ON contest_entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_entries_contest_approved ON contest_entries(contest_id) WHERE approved = true;
CREATE INDEX IF NOT EXISTS idx_entries_user ON contest_entries(user_id);

-- Fast vote counting
CREATE INDEX IF NOT EXISTS idx_votes_entry ON contest_votes(entry_id);
CREATE INDEX IF NOT EXISTS idx_votes_contest ON contest_votes(contest_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON contest_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_contest ON contest_votes(voter_id, contest_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Update vote_count on contest_entries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_entry_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contest_entries 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.entry_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contest_entries 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.entry_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_vote_count ON contest_votes;
CREATE TRIGGER trigger_update_vote_count
  AFTER INSERT OR DELETE ON contest_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_entry_vote_count();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Update contests.updated_at
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_contest_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contest_updated ON contests;
CREATE TRIGGER trigger_contest_updated
  BEFORE UPDATE ON contests
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_timestamp();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Get user's vote count for a contest
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_vote_count(p_contest_id UUID, p_user_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT 
  FROM contest_votes 
  WHERE contest_id = p_contest_id AND voter_id = p_user_id;
$$ LANGUAGE sql STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Check if user can vote (within limits)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION can_user_vote(p_contest_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_votes INT;
  v_current_votes INT;
  v_status contest_status;
BEGIN
  -- Get contest settings
  SELECT max_votes_per_user, status INTO v_max_votes, v_status
  FROM contests WHERE id = p_contest_id;
  
  -- Must be in voting phase
  IF v_status != 'voting' THEN
    RETURN false;
  END IF;
  
  -- Count current votes
  SELECT COUNT(*) INTO v_current_votes
  FROM contest_votes
  WHERE contest_id = p_contest_id AND voter_id = p_user_id;
  
  RETURN v_current_votes < v_max_votes;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Select contest winner
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION select_contest_winner(p_contest_id UUID)
RETURNS UUID AS $$
DECLARE
  v_winner_id UUID;
BEGIN
  -- Select entry with most votes (tie-breaker: earliest submission)
  SELECT id INTO v_winner_id
  FROM contest_entries
  WHERE contest_id = p_contest_id AND approved = true
  ORDER BY vote_count DESC, created_at ASC
  LIMIT 1;
  
  -- Update contest with winner
  UPDATE contests
  SET 
    winner_entry_id = v_winner_id,
    status = 'finished'
  WHERE id = p_contest_id;
  
  RETURN v_winner_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_votes ENABLE ROW LEVEL SECURITY;

-- CONTESTS: Anyone can view non-draft contests
CREATE POLICY "View active contests" ON contests
  FOR SELECT USING (status != 'draft');

-- CONTESTS: Only admins can manage
CREATE POLICY "Admins manage contests" ON contests
  FOR ALL USING (is_admin(auth.uid()));

-- ENTRIES: Anyone can view approved entries
CREATE POLICY "View approved entries" ON contest_entries
  FOR SELECT USING (approved = true);

-- ENTRIES: Users can view their own entries (even unapproved)
CREATE POLICY "View own entries" ON contest_entries
  FOR SELECT USING (user_id = auth.uid());

-- ENTRIES: Users can submit their own photos
CREATE POLICY "Submit own photos" ON contest_entries
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- Verify user owns the image
    EXISTS (
      SELECT 1 FROM images i
      JOIN galleries g ON i.gallery_id = g.id
      WHERE i.id = image_id AND g.user_id = auth.uid()
    ) AND
    -- Verify contest is accepting submissions
    EXISTS (
      SELECT 1 FROM contests c
      WHERE c.id = contest_id 
      AND c.status = 'submissions_open'
      AND now() BETWEEN c.submission_starts_at AND c.submission_ends_at
    )
  );

-- ENTRIES: Users can delete their own unapproved entries
CREATE POLICY "Delete own unapproved entries" ON contest_entries
  FOR DELETE USING (user_id = auth.uid() AND approved = false);

-- VOTES: Logged-in users can vote
CREATE POLICY "Cast vote" ON contest_votes
  FOR INSERT WITH CHECK (
    auth.uid() = voter_id AND
    -- Contest must be in voting phase
    EXISTS (
      SELECT 1 FROM contests c
      WHERE c.id = contest_id 
      AND c.status = 'voting'
      AND now() BETWEEN c.voting_starts_at AND c.voting_ends_at
    ) AND
    -- Entry must be approved
    EXISTS (
      SELECT 1 FROM contest_entries e
      WHERE e.id = entry_id AND e.approved = true
    ) AND
    -- User hasn't exceeded vote limit
    can_user_vote(contest_id, auth.uid())
  );

-- VOTES: Users can see their own votes
CREATE POLICY "View own votes" ON contest_votes
  FOR SELECT USING (voter_id = auth.uid());

-- VOTES: Users can remove their own votes
CREATE POLICY "Remove own vote" ON contest_votes
  FOR DELETE USING (voter_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN OVERRIDE POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Admin view all entries" ON contest_entries
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admin manage entries" ON contest_entries
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admin view all votes" ON contest_votes
  FOR SELECT USING (is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- GRANT PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT ON contests TO authenticated;
GRANT SELECT, INSERT, DELETE ON contest_entries TO authenticated;
GRANT SELECT, INSERT, DELETE ON contest_votes TO authenticated;

GRANT ALL ON contests TO service_role;
GRANT ALL ON contest_entries TO service_role;
GRANT ALL ON contest_votes TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────────
COMMENT ON TABLE contests IS 'Monthly photo contest definitions for Community Spotlight';
COMMENT ON TABLE contest_entries IS 'Photo submissions to contests';
COMMENT ON TABLE contest_votes IS 'User votes on contest entries';
