# Spotlight Evaluation System

> State-of-the-art photography evaluation system inspired by Awwwards, tailored for photography.

## Overview

The Spotlight Evaluation System is a comprehensive jury-based scoring system that evaluates photography submissions across multiple criteria. It combines expert jury scores with community engagement to provide fair, transparent recognition.

## Architecture

### What Makes This Unique

| Feature | Awwwards | 12img Spotlight |
|---------|----------|-----------------|
| Criteria | 4 (Design, Usability, Creativity, Content) | 6 photography-specific |
| Scoring | 0-10 per criteria | 0-10 with weighted averages |
| Jury System | Expert reviewers | Professional photographers with specializations |
| Outlier Removal | 3 furthest from average | Top/bottom excluded when ≥6 jury |
| Award Tiers | HM → SOTD → SOTM → SOTY | Featured → SOTD → Photographer of Week → SOTM → SOTY |
| Public Breakdown | Score per criteria | Full breakdown with jury table |

## Database Schema

### Tables

```
evaluation_criteria      - 6 photography criteria with weights
jury_members            - Expert photographers
entry_evaluations       - Individual jury scores per criteria
entry_scores            - Computed aggregate scores
spotlight_awards        - Awards given (SOTD, Featured, etc.)
photographer_rankings   - Monthly leaderboard
community_pro_votes     - Weighted PRO user votes
```

### Migration

Run: `database/migrations/061-spotlight-evaluation-system.sql`

## Evaluation Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| **Composition** | 25% | Framing, balance, rule of thirds, leading lines, visual flow |
| **Lighting** | 25% | Exposure, shadows, highlights, mood, dynamic range |
| **Technical** | 20% | Sharpness, focus accuracy, noise control, color accuracy |
| **Creativity** | 15% | Originality, unique perspective, storytelling, concept |
| **Impact** | 15% | Emotional resonance, viewer engagement, memorability |
| Post-Processing | 0%* | Editing quality, color grading (optional criterion) |

*Post-processing can be enabled with weight adjustment.

## Scoring System

### Score Calculation

```
Overall Score = (Jury Score × 0.70) + (Community Score × 0.30)
```

- **Jury Score**: Weighted average across all criteria
- **Community Score**: Normalized from vote count (logarithmic scale)

### Outlier Removal

When an entry has ≥6 jury evaluations, the highest and lowest scores per criteria are excluded:

```sql
-- Example: 8 jury scores for Composition
-- Scores: 7, 7.5, 8, 8.5, 8.5, 9, 9, 9.5
-- Excluded: 7 (lowest), 9.5 (highest)
-- Final average: (7.5 + 8 + 8.5 + 8.5 + 9 + 9) / 6 = 8.42
```

## Award Tiers

### 1. Featured ✨
- **Threshold**: Score ≥ 6.5
- **Requirements**: ≥2 jury evaluations
- **Frequency**: Automatic, continuous

### 2. Shot of the Day 🏆
- **Threshold**: Score ≥ 7.0
- **Requirements**: ≥3 jury evaluations, highest score of the day
- **Frequency**: Daily at 1:00 AM UTC

### 3. Photographer of the Week ⭐
- **Requirements**: Most consistent quality across multiple submissions
- **Frequency**: Weekly

### 4. Shot of the Month 👑
- **Pool**: All SOTD winners from the month
- **Selection**: Highest average score + community votes
- **Frequency**: First of each month

### 5. Shot of the Year 💎
- **Pool**: All SOTM winners from the year
- **Selection**: Jury re-evaluation + community voting
- **Frequency**: February of following year

## API Reference

### Server Actions

```typescript
// lib/spotlight/evaluation-types.ts - Types
// server/actions/evaluation.actions.ts - Server actions

// Public
getEvaluationCriteria(): Promise<EvaluationCriteria[]>
getEntryEvaluation(entryId): Promise<EntryEvaluationPage | null>
getLeaderboard(year?, month?, limit?): Promise<LeaderboardData>
getRecentAwards(limit?): Promise<AwardsPageData>
getActiveJuryMembers(): Promise<JuryMemberWithProfile[]>

// Jury
isJuryMember(): Promise<{ isJury: boolean; juryMember: JuryMember | null }>
getJuryPendingEntries(): Promise<EntryWithScores[]>
submitEvaluation(input): Promise<SubmitEvaluationResult>

// Admin
appointJuryMember(userId, displayName, specializations?, bio?)
removeJuryMember(juryMemberId)
runDailyAwards()
updateRankings(year?, month?)
```

## Components

```typescript
// components/spotlight/

// Score display
<ScoreDisplay scores={entryScores} showBreakdown animated />
<InlineScore score={7.5} label />
<ScoreBadge score={8.2} />

// Awards
<AwardBadge award="shot_of_the_day" size="lg" />
<AwardStack awards={entry.awards} maxShow={3} />
<AwardIndicator awards={entry.awards} />
<AwardCard award={award} showDate />

// Jury
<JuryEvaluationForm entryId={id} criteria={criteria} existingScores={scores} />
```

## Pages

| Route | Description |
|-------|-------------|
| `/spotlight` | Main spotlight gallery (existing) |
| `/spotlight/entry/[entryId]` | Entry evaluation breakdown |
| `/spotlight/leaderboard` | Monthly photographer rankings |
| `/spotlight/awards` | Award showcase (SOTD, Featured, etc.) |
| `/spotlight/about-evaluation` | Evaluation system explainer |

## Cron Jobs

### `/api/cron/spotlight-awards`
- **Schedule**: Daily at 1:00 AM UTC (`0 1 * * *`)
- **Actions**:
  1. Award SOTD for yesterday
  2. Award Featured to qualifying entries
  3. Update monthly rankings

### `/api/cron/contest-winner`
- **Schedule**: Daily at midnight UTC (`0 0 * * *`)
- **Actions**: Contest phase transitions and winner selection

## Jury Management

### Appointing Jury Members

```typescript
// Admin panel or direct call
await appointJuryMember(
  userId,
  'Jane Photographer',
  ['portrait', 'wedding'],
  'Professional photographer with 10+ years experience'
)
```

### Jury Specializations

- `portrait`
- `landscape`
- `wedding`
- `commercial`
- `street`
- `documentary`
- `fine_art`
- `general`

## UI/UX Design

### Score Colors

```typescript
const CRITERIA_COLORS = {
  composition: '#3B82F6',    // Blue
  lighting: '#F59E0B',       // Amber
  technical: '#10B981',      // Emerald
  creativity: '#8B5CF6',     // Violet
  impact: '#EC4899',         // Pink
  post_processing: '#6B7280', // Gray
}
```

### Score Labels

| Score | Label |
|-------|-------|
| ≥9.0 | Exceptional |
| ≥8.0 | Outstanding |
| ≥7.0 | Excellent |
| ≥6.5 | Great |
| ≥6.0 | Good |
| ≥5.0 | Average |
| <5.0 | Below Average |

## Implementation Checklist

### Database
- [x] Create migration `061-spotlight-evaluation-system.sql`
- [x] Add evaluation criteria with weights
- [x] Create jury_members table
- [x] Create entry_evaluations table
- [x] Create entry_scores table with triggers
- [x] Create spotlight_awards table
- [x] Create photographer_rankings table
- [x] Add RPC functions for score calculation
- [x] Add RPC functions for award processing

### Backend
- [x] Create types (`lib/spotlight/evaluation-types.ts`)
- [x] Create server actions (`server/actions/evaluation.actions.ts`)
- [x] Add cron job for daily awards

### Frontend
- [x] ScoreDisplay component
- [x] AwardBadge components
- [x] JuryEvaluationForm component
- [x] Entry evaluation page
- [x] Leaderboard page
- [x] Awards page
- [x] About evaluation page

### Integration
- [ ] Add scores to existing spotlight gallery cards
- [ ] Add awards to photographer profiles
- [ ] Add evaluation link to contest entries
- [ ] Email notifications for awards
- [ ] Admin panel for jury management

## Future Enhancements

1. **AI Pre-screening**: Auto-score technical quality before jury review
2. **Jury Dashboard**: Dedicated interface for jury members
3. **Historical Analytics**: Trend analysis for photographers
4. **Peer Comparison**: See how your work compares to winners
5. **Award Notifications**: Email + in-app notifications
6. **Badge Display**: Profile badges for awards won
7. **Jury Applications**: Process for becoming a jury member
