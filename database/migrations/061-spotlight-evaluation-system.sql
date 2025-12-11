-- ============================================================================
-- SPOTLIGHT EVALUATION SYSTEM
-- State-of-the-art photography evaluation inspired by Awwwards
-- ============================================================================
-- 
-- This migration creates a comprehensive jury-based evaluation system for the
-- Community Spotlight feature. Photographers' submissions are evaluated across
-- multiple criteria by jury members and the community.
--
-- FEATURES:
--   - 6 photography-specific evaluation criteria with weights
--   - Jury panel system with photographer specializations
--   - 5-tier award system (Featured → SOTD → Weekly → SOTM → SOTY)
--   - Statistical outlier removal for fair scoring
--   - Real-time score aggregation with triggers
--   - Public evaluation breakdown pages
--
-- TABLES:
--   evaluation_criteria      - Define scoring criteria with weights
--   jury_members            - Track jury with specializations
--   entry_evaluations       - Individual jury scores per criteria
--   entry_scores            - Computed aggregate scores
--   spotlight_awards        - Track awards given to entries
--   photographer_rankings   - Leaderboard/ranking system
--
-- RUN: Execute this in Supabase SQL Editor after 050-community-spotlight.sql
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM: Award Types
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE spotlight_award_type AS ENUM (
    'featured',              -- Score ≥ 6.5/10 (like Honorable Mention)
    'shot_of_the_day',       -- Highest scoring entry of the day
    'photographer_of_week',  -- Most consistent quality submissions
    'shot_of_the_month',     -- Best of the monthly winners
    'shot_of_the_year'       -- Annual recognition
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM: Jury Specialization (for weighted expertise)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE jury_specialization AS ENUM (
    'portrait',
    'landscape',
    'wedding',
    'commercial',
    'street',
    'documentary',
    'fine_art',
    'general'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: evaluation_criteria
-- Photography-specific evaluation criteria with weights
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Criteria info
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  
  -- Weight (must sum to 100 across all active criteria)
  weight INT NOT NULL CHECK (weight >= 0 AND weight <= 100),
  
  -- Display order
  display_order INT NOT NULL DEFAULT 0,
  
  -- Active status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default photography criteria
INSERT INTO evaluation_criteria (name, slug, description, weight, display_order) VALUES
  ('Composition', 'composition', 'Framing, balance, rule of thirds, leading lines, visual flow', 25, 1),
  ('Lighting', 'lighting', 'Exposure, shadows, highlights, mood, dynamic range', 25, 2),
  ('Technical', 'technical', 'Sharpness, focus accuracy, noise control, color accuracy', 20, 3),
  ('Creativity', 'creativity', 'Originality, unique perspective, storytelling, concept', 15, 4),
  ('Impact', 'impact', 'Emotional resonance, viewer engagement, memorability', 15, 5),
  ('Post-Processing', 'post_processing', 'Editing quality, color grading, retouching skill', 0, 6)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: jury_members
-- Expert photographers who evaluate submissions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jury_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to user
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Jury info
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  website_url TEXT,
  
  -- Specializations (can have multiple)
  specializations jury_specialization[] NOT NULL DEFAULT ARRAY['general']::jury_specialization[],
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Stats
  total_evaluations INT NOT NULL DEFAULT 0,
  average_score_given DECIMAL(4,2),
  
  -- Location (for display)
  country TEXT,
  city TEXT,
  
  -- Audit
  appointed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  appointed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: entry_evaluations
-- Individual jury member scores per criteria per entry
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entry_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  entry_id UUID NOT NULL REFERENCES contest_entries(id) ON DELETE CASCADE,
  jury_member_id UUID NOT NULL REFERENCES jury_members(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  
  -- Score (1-10 scale with decimals for precision)
  score DECIMAL(4,2) NOT NULL CHECK (score >= 0 AND score <= 10),
  
  -- Optional comment for this criteria
  comment TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One score per jury member per criteria per entry
  UNIQUE(entry_id, jury_member_id, criteria_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: entry_scores
-- Aggregated scores per entry (computed from evaluations)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entry_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to entry
  entry_id UUID NOT NULL REFERENCES contest_entries(id) ON DELETE CASCADE UNIQUE,
  
  -- Aggregate scores (all on 0-10 scale)
  jury_score DECIMAL(4,2),           -- Weighted average from jury
  community_score DECIMAL(4,2),       -- Based on community votes
  overall_score DECIMAL(4,2),         -- Combined (70% jury, 30% community)
  
  -- Per-criteria averages
  composition_score DECIMAL(4,2),
  lighting_score DECIMAL(4,2),
  technical_score DECIMAL(4,2),
  creativity_score DECIMAL(4,2),
  impact_score DECIMAL(4,2),
  post_processing_score DECIMAL(4,2),
  
  -- Statistics
  jury_count INT NOT NULL DEFAULT 0,        -- Number of jury evaluations
  scores_excluded INT NOT NULL DEFAULT 0,   -- Outliers removed
  
  -- Community engagement
  view_count INT NOT NULL DEFAULT 0,
  save_count INT NOT NULL DEFAULT 0,
  share_count INT NOT NULL DEFAULT 0,
  
  -- Evaluation status
  evaluation_started_at TIMESTAMPTZ,
  evaluation_completed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: spotlight_awards
-- Track awards given to entries and photographers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spotlight_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What's being awarded
  entry_id UUID REFERENCES contest_entries(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES contests(id) ON DELETE SET NULL,
  
  -- Award details
  award_type spotlight_award_type NOT NULL,
  
  -- For time-based awards
  award_date DATE NOT NULL,  -- The day/week/month/year this award is for
  
  -- Final score at time of award
  final_score DECIMAL(4,2),
  
  -- Display info
  badge_url TEXT,
  citation TEXT,  -- "For exceptional composition and lighting"
  
  -- Audit
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  awarded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate awards for same entry/date/type
  UNIQUE(entry_id, award_type, award_date)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: photographer_rankings
-- Leaderboard/ranking system for photographers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photographer_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The photographer
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time period (monthly rankings)
  period_year INT NOT NULL,
  period_month INT NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  
  -- Stats for this period
  entries_submitted INT NOT NULL DEFAULT 0,
  entries_featured INT NOT NULL DEFAULT 0,
  total_votes_received INT NOT NULL DEFAULT 0,
  average_score DECIMAL(4,2),
  highest_score DECIMAL(4,2),
  
  -- Awards in this period
  sotd_count INT NOT NULL DEFAULT 0,
  featured_count INT NOT NULL DEFAULT 0,
  
  -- Ranking
  rank INT,  -- 1 = top ranked for the period
  
  -- Audit
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, period_year, period_month)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: community_pro_votes
-- Enhanced voting for PRO users (weighted more than regular votes)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_pro_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  entry_id UUID NOT NULL REFERENCES contest_entries(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Score given (PRO users can rate, not just vote)
  score DECIMAL(4,2) CHECK (score >= 1 AND score <= 10),
  
  -- Is this from a verified PRO user?
  is_pro_vote BOOLEAN NOT NULL DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One vote per user per entry
  UNIQUE(entry_id, voter_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Fast lookup of evaluations by entry
CREATE INDEX IF NOT EXISTS idx_entry_evaluations_entry ON entry_evaluations(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_evaluations_jury ON entry_evaluations(jury_member_id);

-- Fast lookup of scores
CREATE INDEX IF NOT EXISTS idx_entry_scores_overall ON entry_scores(overall_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_entry_scores_jury ON entry_scores(jury_score DESC NULLS LAST);

-- Fast lookup of awards
CREATE INDEX IF NOT EXISTS idx_awards_entry ON spotlight_awards(entry_id);
CREATE INDEX IF NOT EXISTS idx_awards_user ON spotlight_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_awards_type_date ON spotlight_awards(award_type, award_date DESC);

-- Ranking lookup
CREATE INDEX IF NOT EXISTS idx_rankings_period ON photographer_rankings(period_year, period_month, rank);
CREATE INDEX IF NOT EXISTS idx_rankings_user ON photographer_rankings(user_id);

-- Jury member lookup
CREATE INDEX IF NOT EXISTS idx_jury_active ON jury_members(is_active) WHERE is_active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Calculate entry scores from evaluations
-- Implements statistical outlier removal (like Awwwards)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_entry_score(p_entry_id UUID)
RETURNS VOID AS $$
DECLARE
  v_jury_count INT;
  v_scores_excluded INT := 0;
  v_jury_score DECIMAL(4,2);
  v_composition DECIMAL(4,2);
  v_lighting DECIMAL(4,2);
  v_technical DECIMAL(4,2);
  v_creativity DECIMAL(4,2);
  v_impact DECIMAL(4,2);
  v_post_processing DECIMAL(4,2);
  v_community_score DECIMAL(4,2);
  v_overall_score DECIMAL(4,2);
  v_vote_count INT;
BEGIN
  -- Count jury evaluations
  SELECT COUNT(DISTINCT jury_member_id) INTO v_jury_count
  FROM entry_evaluations WHERE entry_id = p_entry_id;
  
  -- Calculate per-criteria scores (excluding outliers if enough jury members)
  -- Outlier removal: if >= 6 jury members, exclude the highest and lowest score per criteria
  
  -- Composition
  SELECT AVG(score) INTO v_composition
  FROM (
    SELECT score, 
           ROW_NUMBER() OVER (ORDER BY score) as rn_asc,
           ROW_NUMBER() OVER (ORDER BY score DESC) as rn_desc,
           COUNT(*) OVER () as total
    FROM entry_evaluations ee
    JOIN evaluation_criteria ec ON ee.criteria_id = ec.id
    WHERE ee.entry_id = p_entry_id AND ec.slug = 'composition'
  ) sub
  WHERE (total < 6) OR (rn_asc > 1 AND rn_desc > 1);
  
  -- Lighting
  SELECT AVG(score) INTO v_lighting
  FROM (
    SELECT score, 
           ROW_NUMBER() OVER (ORDER BY score) as rn_asc,
           ROW_NUMBER() OVER (ORDER BY score DESC) as rn_desc,
           COUNT(*) OVER () as total
    FROM entry_evaluations ee
    JOIN evaluation_criteria ec ON ee.criteria_id = ec.id
    WHERE ee.entry_id = p_entry_id AND ec.slug = 'lighting'
  ) sub
  WHERE (total < 6) OR (rn_asc > 1 AND rn_desc > 1);
  
  -- Technical
  SELECT AVG(score) INTO v_technical
  FROM (
    SELECT score, 
           ROW_NUMBER() OVER (ORDER BY score) as rn_asc,
           ROW_NUMBER() OVER (ORDER BY score DESC) as rn_desc,
           COUNT(*) OVER () as total
    FROM entry_evaluations ee
    JOIN evaluation_criteria ec ON ee.criteria_id = ec.id
    WHERE ee.entry_id = p_entry_id AND ec.slug = 'technical'
  ) sub
  WHERE (total < 6) OR (rn_asc > 1 AND rn_desc > 1);
  
  -- Creativity
  SELECT AVG(score) INTO v_creativity
  FROM (
    SELECT score, 
           ROW_NUMBER() OVER (ORDER BY score) as rn_asc,
           ROW_NUMBER() OVER (ORDER BY score DESC) as rn_desc,
           COUNT(*) OVER () as total
    FROM entry_evaluations ee
    JOIN evaluation_criteria ec ON ee.criteria_id = ec.id
    WHERE ee.entry_id = p_entry_id AND ec.slug = 'creativity'
  ) sub
  WHERE (total < 6) OR (rn_asc > 1 AND rn_desc > 1);
  
  -- Impact
  SELECT AVG(score) INTO v_impact
  FROM (
    SELECT score, 
           ROW_NUMBER() OVER (ORDER BY score) as rn_asc,
           ROW_NUMBER() OVER (ORDER BY score DESC) as rn_desc,
           COUNT(*) OVER () as total
    FROM entry_evaluations ee
    JOIN evaluation_criteria ec ON ee.criteria_id = ec.id
    WHERE ee.entry_id = p_entry_id AND ec.slug = 'impact'
  ) sub
  WHERE (total < 6) OR (rn_asc > 1 AND rn_desc > 1);
  
  -- Post-Processing (optional criteria with 0 weight by default)
  SELECT AVG(score) INTO v_post_processing
  FROM (
    SELECT score, 
           ROW_NUMBER() OVER (ORDER BY score) as rn_asc,
           ROW_NUMBER() OVER (ORDER BY score DESC) as rn_desc,
           COUNT(*) OVER () as total
    FROM entry_evaluations ee
    JOIN evaluation_criteria ec ON ee.criteria_id = ec.id
    WHERE ee.entry_id = p_entry_id AND ec.slug = 'post_processing'
  ) sub
  WHERE (total < 6) OR (rn_asc > 1 AND rn_desc > 1);
  
  -- Calculate weighted jury score
  SELECT 
    (COALESCE(v_composition, 0) * ec_comp.weight +
     COALESCE(v_lighting, 0) * ec_light.weight +
     COALESCE(v_technical, 0) * ec_tech.weight +
     COALESCE(v_creativity, 0) * ec_create.weight +
     COALESCE(v_impact, 0) * ec_impact.weight) / 
    NULLIF(ec_comp.weight + ec_light.weight + ec_tech.weight + ec_create.weight + ec_impact.weight, 0)
  INTO v_jury_score
  FROM evaluation_criteria ec_comp,
       evaluation_criteria ec_light,
       evaluation_criteria ec_tech,
       evaluation_criteria ec_create,
       evaluation_criteria ec_impact
  WHERE ec_comp.slug = 'composition'
    AND ec_light.slug = 'lighting'
    AND ec_tech.slug = 'technical'
    AND ec_create.slug = 'creativity'
    AND ec_impact.slug = 'impact';
  
  -- Calculate community score from votes (normalized to 10-point scale)
  SELECT vote_count INTO v_vote_count
  FROM contest_entries WHERE id = p_entry_id;
  
  -- Community score: logarithmic scale based on votes
  -- More votes = higher score, but with diminishing returns
  v_community_score := LEAST(10, 5 + (LN(GREATEST(v_vote_count, 1) + 1) * 1.5));
  
  -- Calculate overall score (70% jury, 30% community when jury score exists)
  IF v_jury_score IS NOT NULL THEN
    v_overall_score := (v_jury_score * 0.7) + (COALESCE(v_community_score, 5) * 0.3);
  ELSE
    v_overall_score := v_community_score;
  END IF;
  
  -- Count excluded scores (for transparency)
  IF v_jury_count >= 6 THEN
    v_scores_excluded := 2;  -- Top and bottom excluded per criteria
  END IF;
  
  -- Upsert entry_scores
  INSERT INTO entry_scores (
    entry_id, jury_score, community_score, overall_score,
    composition_score, lighting_score, technical_score,
    creativity_score, impact_score, post_processing_score,
    jury_count, scores_excluded, updated_at
  ) VALUES (
    p_entry_id, v_jury_score, v_community_score, v_overall_score,
    v_composition, v_lighting, v_technical,
    v_creativity, v_impact, v_post_processing,
    v_jury_count, v_scores_excluded, now()
  )
  ON CONFLICT (entry_id) DO UPDATE SET
    jury_score = EXCLUDED.jury_score,
    community_score = EXCLUDED.community_score,
    overall_score = EXCLUDED.overall_score,
    composition_score = EXCLUDED.composition_score,
    lighting_score = EXCLUDED.lighting_score,
    technical_score = EXCLUDED.technical_score,
    creativity_score = EXCLUDED.creativity_score,
    impact_score = EXCLUDED.impact_score,
    post_processing_score = EXCLUDED.post_processing_score,
    jury_count = EXCLUDED.jury_count,
    scores_excluded = EXCLUDED.scores_excluded,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Auto-calculate scores when evaluations change
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_recalculate_entry_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_entry_score(OLD.entry_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_entry_score(NEW.entry_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS recalculate_score_on_evaluation ON entry_evaluations;
CREATE TRIGGER recalculate_score_on_evaluation
  AFTER INSERT OR UPDATE OR DELETE ON entry_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_entry_score();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Update community score when votes change
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_update_community_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_entry_score(OLD.entry_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_entry_score(NEW.entry_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_community_score_on_vote ON contest_votes;
CREATE TRIGGER update_community_score_on_vote
  AFTER INSERT OR DELETE ON contest_votes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_community_score();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Award Shot of the Day
-- Run daily to find and award the highest scoring entry
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_shot_of_the_day(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS UUID AS $$
DECLARE
  v_winner_entry_id UUID;
  v_winner_user_id UUID;
  v_winner_score DECIMAL(4,2);
  v_award_id UUID;
BEGIN
  -- Find highest scoring entry from the given date that meets threshold
  SELECT ce.id, ce.user_id, es.overall_score
  INTO v_winner_entry_id, v_winner_user_id, v_winner_score
  FROM contest_entries ce
  JOIN entry_scores es ON ce.id = es.entry_id
  WHERE ce.created_at::date = p_date
    AND ce.approved = true
    AND es.overall_score >= 7.0  -- Minimum score threshold for SOTD
    AND es.jury_count >= 3       -- Minimum jury evaluations
  ORDER BY es.overall_score DESC, es.jury_count DESC
  LIMIT 1;
  
  IF v_winner_entry_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if already awarded
  IF EXISTS (
    SELECT 1 FROM spotlight_awards 
    WHERE entry_id = v_winner_entry_id 
    AND award_type = 'shot_of_the_day'
  ) THEN
    RETURN NULL;
  END IF;
  
  -- Create award
  INSERT INTO spotlight_awards (
    entry_id, user_id, award_type, award_date, final_score, 
    citation, awarded_at
  ) VALUES (
    v_winner_entry_id, v_winner_user_id, 'shot_of_the_day', p_date, v_winner_score,
    'Exceptional photography recognized by our jury and community',
    now()
  )
  RETURNING id INTO v_award_id;
  
  -- Also award Featured if score >= 6.5 and not already featured
  IF v_winner_score >= 6.5 AND NOT EXISTS (
    SELECT 1 FROM spotlight_awards 
    WHERE entry_id = v_winner_entry_id AND award_type = 'featured'
  ) THEN
    INSERT INTO spotlight_awards (
      entry_id, user_id, award_type, award_date, final_score, awarded_at
    ) VALUES (
      v_winner_entry_id, v_winner_user_id, 'featured', p_date, v_winner_score, now()
    );
  END IF;
  
  RETURN v_award_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Award Featured entries
-- Entries scoring >= 6.5 get Featured status
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_featured_entries()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_entry RECORD;
BEGIN
  FOR v_entry IN
    SELECT ce.id, ce.user_id, es.overall_score, ce.created_at::date as entry_date
    FROM contest_entries ce
    JOIN entry_scores es ON ce.id = es.entry_id
    WHERE ce.approved = true
      AND es.overall_score >= 6.5
      AND es.jury_count >= 2
      AND NOT EXISTS (
        SELECT 1 FROM spotlight_awards 
        WHERE entry_id = ce.id AND award_type = 'featured'
      )
  LOOP
    INSERT INTO spotlight_awards (
      entry_id, user_id, award_type, award_date, final_score, awarded_at
    ) VALUES (
      v_entry.id, v_entry.user_id, 'featured', v_entry.entry_date, 
      v_entry.overall_score, now()
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Update photographer rankings
-- Run monthly to calculate rankings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_photographer_rankings(
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  p_month INT DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)
)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_photographer RECORD;
BEGIN
  -- Clear existing rankings for this period
  DELETE FROM photographer_rankings 
  WHERE period_year = p_year AND period_month = p_month;
  
  -- Calculate and insert new rankings
  FOR v_photographer IN
    SELECT 
      ce.user_id,
      COUNT(ce.id) as entries_submitted,
      COUNT(CASE WHEN sa.award_type = 'featured' THEN 1 END) as entries_featured,
      SUM(ce.vote_count) as total_votes_received,
      AVG(es.overall_score) as average_score,
      MAX(es.overall_score) as highest_score,
      COUNT(CASE WHEN sa.award_type = 'shot_of_the_day' THEN 1 END) as sotd_count,
      ROW_NUMBER() OVER (ORDER BY AVG(es.overall_score) DESC NULLS LAST) as rank
    FROM contest_entries ce
    LEFT JOIN entry_scores es ON ce.id = es.entry_id
    LEFT JOIN spotlight_awards sa ON ce.id = sa.entry_id
    WHERE ce.approved = true
      AND EXTRACT(YEAR FROM ce.created_at) = p_year
      AND EXTRACT(MONTH FROM ce.created_at) = p_month
    GROUP BY ce.user_id
    HAVING COUNT(ce.id) >= 1
  LOOP
    INSERT INTO photographer_rankings (
      user_id, period_year, period_month,
      entries_submitted, entries_featured, total_votes_received,
      average_score, highest_score, sotd_count, featured_count, rank
    ) VALUES (
      v_photographer.user_id, p_year, p_month,
      v_photographer.entries_submitted, v_photographer.entries_featured,
      v_photographer.total_votes_received, v_photographer.average_score,
      v_photographer.highest_score, v_photographer.sotd_count,
      v_photographer.entries_featured, v_photographer.rank
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE jury_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotlight_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographer_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_pro_votes ENABLE ROW LEVEL SECURITY;

-- Evaluation criteria: Public read, admin write
CREATE POLICY "Public can view criteria" ON evaluation_criteria
  FOR SELECT USING (true);

-- Jury members: Public can view active jury
CREATE POLICY "Public can view active jury" ON jury_members
  FOR SELECT USING (is_active = true);

-- Entry evaluations: Jury can create/update their own, public can view after contest ends
CREATE POLICY "Jury can evaluate" ON entry_evaluations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM jury_members WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Jury can update own evaluations" ON entry_evaluations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM jury_members jm 
            WHERE jm.id = jury_member_id AND jm.user_id = auth.uid())
  );

CREATE POLICY "Public can view evaluations" ON entry_evaluations
  FOR SELECT USING (true);

-- Entry scores: Public read
CREATE POLICY "Public can view scores" ON entry_scores
  FOR SELECT USING (true);

-- Awards: Public read
CREATE POLICY "Public can view awards" ON spotlight_awards
  FOR SELECT USING (true);

-- Rankings: Public read
CREATE POLICY "Public can view rankings" ON photographer_rankings
  FOR SELECT USING (true);

-- Community votes: Users can vote, public can view
CREATE POLICY "Users can vote" ON community_pro_votes
  FOR INSERT WITH CHECK (voter_id = auth.uid());

CREATE POLICY "Public can view votes" ON community_pro_votes
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────────────────────────────────────
COMMENT ON TABLE evaluation_criteria IS 'Photography-specific scoring criteria with configurable weights';
COMMENT ON TABLE jury_members IS 'Expert photographers who evaluate contest submissions';
COMMENT ON TABLE entry_evaluations IS 'Individual scores given by jury members per criteria';
COMMENT ON TABLE entry_scores IS 'Aggregated scores computed from jury evaluations and community votes';
COMMENT ON TABLE spotlight_awards IS 'Awards given to exceptional entries (SOTD, Featured, etc.)';
COMMENT ON TABLE photographer_rankings IS 'Monthly leaderboard rankings for photographers';
COMMENT ON FUNCTION calculate_entry_score IS 'Calculates weighted scores with outlier removal';
COMMENT ON FUNCTION award_shot_of_the_day IS 'Daily job to award SOTD to highest scoring entry';
