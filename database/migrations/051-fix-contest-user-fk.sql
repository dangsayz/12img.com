-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION 051: Fix contest_entries user_id foreign key
-- ─────────────────────────────────────────────────────────────────────────────
-- 
-- Problem: contest_entries.user_id references auth.users(id) but 12img uses
-- Clerk for auth with a separate public.users table synced via webhook.
-- 
-- Solution: Change FK to reference public.users(id) instead.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the incorrect foreign key constraint
ALTER TABLE contest_entries 
  DROP CONSTRAINT IF EXISTS contest_entries_user_id_fkey;

-- Add correct foreign key to public.users
ALTER TABLE contest_entries 
  ADD CONSTRAINT contest_entries_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Also fix approved_by if it exists with wrong reference
ALTER TABLE contest_entries 
  DROP CONSTRAINT IF EXISTS contest_entries_approved_by_fkey;

-- approved_by can be null, references the admin who approved
ALTER TABLE contest_entries 
  ADD CONSTRAINT contest_entries_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Fix contests.created_by as well
ALTER TABLE contests 
  DROP CONSTRAINT IF EXISTS contests_created_by_fkey;

ALTER TABLE contests 
  ADD CONSTRAINT contests_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Fix contest_votes.voter_id
ALTER TABLE contest_votes 
  DROP CONSTRAINT IF EXISTS contest_votes_voter_id_fkey;

ALTER TABLE contest_votes 
  ADD CONSTRAINT contest_votes_voter_id_fkey 
  FOREIGN KEY (voter_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────────
COMMENT ON TABLE contest_entries IS 'Photo submissions to contests - user_id references public.users';
