# 🏆 Community Spotlight System - Implementation Checklist

> **Goal**: Monthly photo-voting contest system integrated into 12img
> **Priority**: Mobile-first, ultra-minimal UI, seamless integration

---

## 📋 MASTER CHECKLIST

Use this to track progress. Check off each item as completed.

### Phase 1: Database Foundation
- [x] **1.1** Create migration file `050-community-spotlight.sql`
- [x] **1.2** Create `contests` table
- [x] **1.3** Create `contest_entries` table  
- [x] **1.4** Create `contest_votes` table
- [x] **1.5** Add indexes for performance
- [x] **1.6** Add RLS policies
- [x] **1.7** Create helper functions (tally votes, select winner)
- [ ] **1.8** Run migration in Supabase ⚠️ **MANUAL STEP**
- [x] **1.9** Update `types/database.ts` with new types → `lib/contest/types.ts`

### Phase 2: Server Actions & API
- [x] **2.1** Create `server/actions/contest.actions.ts`
- [x] **2.2** Implement `getActiveContest()`
- [x] **2.3** Implement `getContestEntries(contestId)`
- [x] **2.4** Implement `submitEntry(imageId)` - nominate existing photo
- [ ] **2.5** Implement `submitNewEntry(file)` - upload new photo (FUTURE)
- [x] **2.6** Implement `castVote(entryId)`
- [x] **2.7** Implement `removeVote(entryId)`
- [x] **2.8** Implement `getUserVotes(contestId)` (via getContestPageData)
- [x] **2.9** Implement `getContestWinner(contestId)` (via getSpotlightCardData)
- [x] **2.10** Create `/api/contest/image-urls` route

### Phase 3: Admin Panel
- [ ] **3.1** Create `/dashboard/admin/contests` page
- [ ] **3.2** Create contest form (theme, dates, status)
- [ ] **3.3** Entry approval/rejection UI
- [x] **3.4** Force-close voting action (selectWinner in actions)
- [x] **3.5** Winner selection override (selectWinner in actions)

### Phase 4: Submission Flows (3 Entry Points)
- [ ] **4.1** **Flow A**: "Nominate" button on image detail/hover
- [x] **4.2** **Flow B**: `/contest/submit` dedicated page
- [x] **4.3** **Flow C**: Deep-link from homepage card
- [x] **4.4** Gallery picker modal (select existing photo)
- [ ] **4.5** Direct upload option on contest page (FUTURE)
- [x] **4.6** Submission limit enforcement (1 per month)
- [x] **4.7** Duplicate submission prevention

### Phase 5: Voting UI
- [x] **5.1** Create `ContestGallery` component (entry grid)
- [x] **5.2** Create `ContestEntryCard` component
- [x] **5.3** Vote button with optimistic update
- [x] **5.4** Vote limit indicator (e.g., "2/3 votes used")
- [x] **5.5** Hide vote counts during voting (optional setting)
- [x] **5.6** Mobile-optimized touch targets (48px min)

### Phase 6: Homepage Integration
- [x] **6.1** Create `CommunitySpotlightCard` server component
- [x] **6.2** Winner display mode (after contest ends)
- [x] **6.3** "Voting in progress" mode
- [x] **6.4** "Submit your shot" CTA mode
- [x] **6.5** Integrate into landing page
- [x] **6.6** Glassmorphism/minimal styling

### Phase 7: Winner Selection & Notifications
- [x] **7.1** Create `/api/cron/contest-winner` endpoint
- [x] **7.2** Tally votes logic
- [x] **7.3** Update contest status to 'finished'
- [ ] **7.4** Email winner notification (FUTURE)
- [ ] **7.5** Email all participants (results) (FUTURE)
- [x] **7.6** Cache winner for homepage display

### Phase 8: Testing & Polish
- [ ] **8.1** Test all 3 submission flows
- [ ] **8.2** Test voting limits
- [ ] **8.3** Test mobile UX (thumb zones)
- [ ] **8.4** Test admin controls
- [ ] **8.5** Test cron job
- [ ] **8.6** Performance audit (indexes working)

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMMUNITY SPOTLIGHT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   CONTESTS   │───▶│   ENTRIES    │───▶│    VOTES     │       │
│  │              │    │              │    │              │       │
│  │ - theme      │    │ - image_id   │    │ - voter_id   │       │
│  │ - dates      │    │ - user_id    │    │ - entry_id   │       │
│  │ - status     │    │ - approved   │    │ - unique     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    EXISTING TABLES                       │    │
│  │  images ◀──────────────┘                                │    │
│  │  profiles ◀────────────────────────────┘                │    │
│  │  galleries                                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        ENTRY POINTS                              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Flow A     │  │  Flow B     │  │  Flow C     │              │
│  │  Nominate   │  │  /contest   │  │  Homepage   │              │
│  │  from Album │  │  /submit    │  │  Card CTA   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│              ┌─────────────────────┐                            │
│              │  submitEntry()      │                            │
│              │  Server Action      │                            │
│              └─────────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA

### Table: `contests`
```sql
CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  theme TEXT,
  description TEXT,
  
  -- Timing
  submission_starts_at TIMESTAMPTZ NOT NULL,
  submission_ends_at TIMESTAMPTZ NOT NULL,
  voting_starts_at TIMESTAMPTZ NOT NULL,
  voting_ends_at TIMESTAMPTZ NOT NULL,
  
  -- Status: draft, submissions_open, voting, finished, cancelled
  status TEXT NOT NULL DEFAULT 'draft',
  
  -- Settings
  max_entries_per_user INT DEFAULT 1,
  max_votes_per_user INT DEFAULT 3,
  show_vote_counts BOOLEAN DEFAULT false,
  require_approval BOOLEAN DEFAULT true,
  
  -- Winner
  winner_entry_id UUID REFERENCES contest_entries(id),
  
  -- Meta
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `contest_entries`
```sql
CREATE TABLE contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  
  -- The photo (references existing images table)
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  
  -- The photographer who submitted
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Approval status
  approved BOOLEAN DEFAULT false,
  rejected BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  
  -- Cached vote count (updated by trigger)
  vote_count INT DEFAULT 0,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate submissions
  UNIQUE(contest_id, image_id)
);
```

### Table: `contest_votes`
```sql
CREATE TABLE contest_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES contest_entries(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- One vote per user per entry
  UNIQUE(contest_id, entry_id, voter_id)
);
```

---

## 🎨 UI/UX SPECIFICATIONS

### Mobile-First Design Principles
1. **Touch targets**: Minimum 48x48px for all interactive elements
2. **Thumb zone**: Primary actions in bottom 60% of screen
3. **One-hand use**: Vote button reachable with thumb
4. **Minimal chrome**: Focus on photos, hide UI on scroll

### Component Hierarchy
```
/contest
├── ContestHeader (theme, countdown)
├── ContestEntryGrid
│   └── ContestEntryCard (repeating)
│       ├── Image
│       ├── Photographer name
│       └── VoteButton (bottom-right, large touch target)
└── ContestFooter (your votes remaining)

/contest/submit
├── SubmitHeader
├── TabSelector (Upload New / Pick Existing)
├── UploadZone OR GalleryPicker
└── SubmitButton (sticky bottom)
```

### Homepage Card States
```
┌─────────────────────────────────┐
│  🏆 COMMUNITY SPOTLIGHT         │
│                                 │
│  [State 1: Winner]              │
│  ┌─────────────────────────┐   │
│  │     Winner Photo        │   │
│  │                         │   │
│  └─────────────────────────┘   │
│  December Winner               │
│  @photographer_name            │
│  "View all finalists →"        │
│                                 │
│  [State 2: Voting Active]       │
│  "Vote for your favorite"      │
│  [Vote Now →]                  │
│                                 │
│  [State 3: Submissions Open]    │
│  "Submit your best shot"       │
│  Theme: Winter Wonderland      │
│  [Enter Contest →]             │
└─────────────────────────────────┘
```

---

## 🔐 SECURITY & ANTI-ABUSE

### RLS Policies
```sql
-- Users can only submit their own photos
CREATE POLICY "Users submit own photos" ON contest_entries
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM images 
      WHERE images.id = image_id 
      AND images.gallery_id IN (
        SELECT id FROM galleries WHERE user_id = auth.uid()
      )
    )
  );

-- Anyone can view approved entries
CREATE POLICY "View approved entries" ON contest_entries
  FOR SELECT USING (approved = true);

-- Logged-in users can vote
CREATE POLICY "Logged in users vote" ON contest_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Users can see their own votes
CREATE POLICY "See own votes" ON contest_votes
  FOR SELECT USING (auth.uid() = voter_id);
```

### Rate Limiting
- **Votes**: Max 3 per contest per user (configurable)
- **Submissions**: Max 1 per contest per user (configurable)
- **Account age**: Optional 7-day minimum to vote

---

## 📱 MOBILE UX DETAILS

### Vote Button Placement
```
┌─────────────────────────────────┐
│                                 │
│         Photo Image             │
│                                 │
│                                 │
│                         ┌─────┐ │
│                         │ ♥ 12│ │  ← Bottom-right
│                         └─────┘ │     48x48px min
└─────────────────────────────────┘
```

### Swipe Gestures (Optional Enhancement)
- Swipe right to vote
- Swipe left to skip
- Pull down to refresh

### Haptic Feedback
- Light tap on vote
- Success vibration on submission

---

## 🔄 CRON JOB LOGIC

### `/api/cron/contest-winner`
```typescript
// Runs daily at midnight UTC
1. Find contests where voting_ends_at < now() AND status = 'voting'
2. For each contest:
   a. Tally votes: SELECT entry_id, COUNT(*) FROM contest_votes GROUP BY entry_id
   b. Select winner (highest votes, tie-breaker: earliest submission)
   c. Update contest: status = 'finished', winner_entry_id = winner
   d. Send winner email
   e. Send participant emails
3. Find contests where submission_starts_at < now() AND status = 'draft'
   a. Update status to 'submissions_open'
4. Find contests where voting_starts_at < now() AND status = 'submissions_open'
   a. Update status to 'voting'
```

---

## 📁 FILE STRUCTURE

```
/app
  /contest
    /page.tsx                    # Contest gallery (voting)
    /submit/page.tsx             # Submission page
    /[contestId]/page.tsx        # Specific contest
    /winners/page.tsx            # Past winners gallery
  /api
    /contest
      /vote/route.ts             # Optimistic vote endpoint
    /cron
      /contest-winner/route.ts   # Daily winner selection

/components
  /contest
    /ContestHeader.tsx
    /ContestEntryGrid.tsx
    /ContestEntryCard.tsx
    /VoteButton.tsx
    /SubmissionForm.tsx
    /GalleryPickerModal.tsx
    /ContestCountdown.tsx
  /spotlight
    /CommunitySpotlightCard.tsx  # Homepage module

/server/actions
  /contest.actions.ts            # All contest server actions

/lib/contest
  /types.ts                      # Contest type definitions
  /utils.ts                      # Helper functions

/database/migrations
  /050-community-spotlight.sql   # Schema migration
```

---

## 🚀 IMPLEMENTATION ORDER

### Day 1: Foundation
1. Create migration file
2. Run migration
3. Update TypeScript types
4. Create basic server actions

### Day 2: Submission Flow
1. Build `/contest/submit` page
2. Gallery picker modal
3. Upload option
4. "Nominate" button on gallery images

### Day 3: Voting UI
1. Contest gallery page
2. Entry cards with vote buttons
3. Optimistic updates
4. Vote limit tracking

### Day 4: Homepage & Admin
1. CommunitySpotlightCard component
2. Admin contest management
3. Entry approval UI

### Day 5: Polish & Cron
1. Winner selection cron
2. Email notifications
3. Mobile testing
4. Performance optimization

---

## ❓ DESIGN DECISION: Submission Method

**Recommendation: Allow ALL THREE pathways**

### Why Multiple Entry Points?
1. **Nominate from album** (Flow A)
   - Lowest friction for existing users
   - Photo already uploaded, just one tap
   - Best for power users with large galleries

2. **Dedicated contest page** (Flow B)
   - Clear, focused experience
   - Good for first-time participants
   - Allows fresh uploads specifically for contest

3. **Homepage CTA** (Flow C)
   - Discovery/awareness driver
   - Converts casual visitors to participants
   - Links to Flow B

### Integration Points
- All flows call the same `submitEntry()` server action
- Validation happens server-side (ownership, limits, timing)
- UI shows consistent feedback across all flows

---

## ✅ SUCCESS CRITERIA

- [ ] User can submit photo in under 10 seconds
- [ ] Voting works with one tap
- [ ] Mobile UX feels native (no pinch/zoom needed)
- [ ] Page loads in under 2 seconds
- [ ] Winner displayed on homepage within 1 hour of contest end
- [ ] Zero duplicate votes possible
- [ ] Admin can manage contests without code changes
