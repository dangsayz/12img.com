# 12img Admin Panel: God-Mode Control System

**Proposal Version:** 1.2  
**Date:** December 9, 2024  
**Status:** IN PROGRESS - STAGE 2

---

## Implementation Progress

### Stage 1: Foundation ✅ COMPLETE

### Stage 2: Control Systems ✅ COMPLETE

| Task | Status | Files |
|------|--------|-------|
| Feature Flags Migration | ✅ DONE | `database/migrations/059-feature-flags.sql` |
| Feature Flags Server | ✅ DONE | `server/admin/flags.ts` |
| Feature Flags Client Hook | ✅ DONE | `lib/hooks/useFeatureFlag.ts` |
| Feature Flags Page | ✅ DONE | `app/admin/flags/page.tsx`, `FlagsContent.tsx` |
| Feature Flags API | ✅ DONE | `app/api/admin/flags/*`, `app/api/flags/[key]` |
| Admin Settings Migration | ✅ DONE | `database/migrations/060-admin-settings.sql` |
| Admin Settings Server | ✅ DONE | `server/admin/settings.ts` |
| Admin Settings Page | ✅ DONE | `app/admin/settings/page.tsx`, `SettingsContent.tsx` |
| Admin Settings API | ✅ DONE | `app/api/admin/settings/*`, `maintenance/*`, `health/*` |

### Stage 2 Features Built:

**Feature Flags System:**
- 5 targeting types: boolean, percentage, plan_based, user_list, date_range
- Consistent hashing for percentage rollouts (same user always gets same result)
- Category organization: general, ui, billing, experimental
- Killswitch marking for emergency flags
- Full CRUD operations with audit trail
- Client-side hook: `useFeatureFlag('flag_key')`
- Server-side check: `checkFeatureFlag('flag_key', userId, plan)`
- Default flags seeded: turbo_upload, editorial_view, pinterest_sharing, etc.

**Admin Settings System:**
- Categorized settings: general, email, storage, billing, security
- Value types: string, number, boolean, json, array
- Sensitive value masking
- Read-only protection
- Full change history with audit trail

**Maintenance Mode:**
- One-click enable/disable
- Severity levels: info, warning, critical
- Custom title and message
- Admin bypass during maintenance
- Automatic audit logging

**System Health Monitoring:**
- Service health checks: database, storage, stripe, resend, clerk
- Status tracking: healthy, degraded, down, unknown
- Response time monitoring
- Manual health check trigger
- Last check timestamps

---

| Task | Status | Files Created/Modified |
|------|--------|------------------------|
| Database Migration | ✅ DONE | `database/migrations/058-admin-galleries-storage.sql` |
| Gallery Server Module | ✅ DONE | `server/admin/galleries.ts` (expanded) |
| Storage Server Module | ✅ DONE | `server/admin/storage.ts` (new) |
| Galleries Page | ✅ DONE | `app/admin/galleries/page.tsx` |
| Galleries Content | ✅ DONE | `app/admin/galleries/GalleriesContent.tsx` |
| Storage Page | ✅ DONE | `app/admin/storage/page.tsx` |
| Storage Content | ✅ DONE | `app/admin/storage/StorageContent.tsx` |
| Storage Cron Job | ✅ DONE | `app/api/cron/storage-snapshot/route.ts` |
| Audit Action Types | ✅ DONE | `lib/admin/types.ts` (updated) |

### What Was Built:

**Galleries Command Center:**
- Advanced search with full-text across title, slug, user email
- Filter by visibility, plan, image count, storage size
- Sort by created date, image count, storage, conversion score
- Conversion scoring algorithm (0-100)
- Hot lead identification for free users
- Bulk selection for future bulk actions
- Direct links to view galleries and user profiles

**Storage Analytics:**
- Platform-wide storage summary
- Storage breakdown by plan tier with visual bar chart
- User storage leaderboard with upgrade potential scoring
- Conversion targets panel (Hot/Warm/Upgrade Ready)
- Bucket analytics (galleries, archives, demo-cards)
- Progress bars with color-coded thresholds (50/80/90%)
- Daily snapshot cron job for trend tracking

**Database Functions Created:**
- `admin_gallery_analytics` - View with computed metrics
- `admin_user_storage` - View with storage calculations
- `search_galleries_admin()` - Advanced search RPC
- `get_platform_storage_summary()` - Platform stats RPC
- `get_top_storage_users()` - Leaderboard RPC
- `get_storage_growth()` - Trend data RPC
- `get_conversion_candidates()` - Hot leads RPC
- `capture_storage_snapshot()` - Daily snapshot RPC
- `admin_transfer_gallery()` - Ownership transfer RPC
- `admin_delete_galleries()` - Bulk delete RPC  

---

## Executive Summary

This proposal outlines the construction of a **world-class admin control system** that goes far beyond basic CRUD operations. The goal is to give you capabilities that:

1. **Predict** user behavior before it happens
2. **Convert** free users to paid with surgical precision
3. **Retain** paying customers by identifying churn signals early
4. **Optimize** every aspect of the platform with real data
5. **Scale** operations without hiring support staff

This is not a standard admin panel. This is a **command center** for running a SaaS business.

---

## Current State

### ✅ Already Built (6 pages)
| Page | Capabilities |
|------|-------------|
| Overview | Stats, revenue, plan breakdown |
| Users | Full CRUD, suspend/reactivate, plan override, search/filter |
| Billing | Stripe integration, MRR, ARR, payments, plan breakdown |
| Emails | Subscriber management, campaigns, tags, engagement tracking |
| Support | Conversation system, archive, delete, user context |
| Audit Logs | Full admin action trail with pagination |
| Contests | Contest CRUD, entry approval, winner selection |
| Feature Requests | User feedback collection |

### ❌ Placeholder Pages (4 pages)
| Page | Current State |
|------|--------------|
| Galleries | "Coming Soon" |
| Storage | "Coming Soon" |
| Feature Flags | "Coming Soon" |
| Settings | "Coming Soon" |

---

## Proposed System Architecture

### Phase 1: Data Intelligence Layer
**Goal:** See everything, understand everything

### Phase 2: Conversion Engine
**Goal:** Turn data into paying customers

### Phase 3: Control Systems
**Goal:** Total platform control

### Phase 4: Predictive Analytics
**Goal:** Know what happens before it happens

---

## Phase 1: Data Intelligence Layer

### 1.1 Galleries Command Center

**File:** `app/admin/galleries/page.tsx`

#### Features:

**Search & Discovery**
- Full-text search across gallery titles, descriptions, user emails
- Filter by: visibility, date range, image count, storage size, user plan
- Sort by: created, updated, image count, storage, view count

**Gallery Deep Dive**
- Click any gallery → see all images with metadata
- View public URL, share stats, download counts
- See email activity (who was invited, who opened, who downloaded)

**Content Moderation**
- Flag inappropriate content
- Bulk delete with audit trail
- Transfer gallery ownership between users

**Conversion Intelligence**
- Highlight galleries near storage limit → upgrade opportunity
- Show galleries with high engagement but free plan → hot leads
- Identify inactive galleries → re-engagement campaigns

**Actions Available:**
```
- View gallery (opens public URL)
- View as owner (impersonate view)
- Delete gallery (with confirmation + audit)
- Transfer ownership
- Toggle visibility (public/private)
- Download all images (for support)
- Export metadata (CSV)
```

---

### 1.2 Storage Analytics & Management

**File:** `app/admin/storage/page.tsx`

#### Features:

**Platform Overview**
- Total storage used across all users
- Storage by plan tier (pie chart)
- Storage growth trend (30/60/90 day line chart)
- Projected storage at current growth rate

**Per-Bucket Breakdown**
- `galleries` - User gallery images
- `archives` - ZIP downloads
- `demo-cards` - Free demo cards
- `profile-images` - User avatars/logos

**User Storage Leaderboard**
- Top 50 users by storage consumption
- Click user → see their galleries
- Identify users at 80%+ capacity → upgrade targets

**Orphan Detection & Cleanup**
- Files in storage not linked to any gallery
- One-click cleanup with dry-run preview
- Scheduled cleanup (weekly cron)

**Storage Alerts**
- Users hitting 90% capacity
- Unusual upload spikes (potential abuse)
- Large single-file uploads

**Conversion Intelligence:**
```
Users at 80%+ storage = UPGRADE TARGETS
- Auto-tag in email system
- Trigger automated "running low" email
- Show upgrade prompt in their dashboard
```

---

## Phase 2: Conversion Engine

### 2.1 User Journey Analytics (NEW)

**File:** `app/admin/analytics/page.tsx`

#### Features:

**Funnel Visualization**
```
Sign Up → Onboarding → First Gallery → First Share → First Paid
   ↓           ↓            ↓             ↓            ↓
  100%        85%          60%           35%          12%
```

**Drop-off Analysis**
- Where do users abandon?
- Time between steps
- Correlation with plan type

**Cohort Analysis**
- Users by signup month
- Retention curves
- Revenue per cohort

**User Scoring**
- Engagement score (0-100)
- Conversion probability
- Churn risk score

**Automated Segments:**
```
🔥 HOT LEADS (High engagement, free plan, near limits)
😴 SLEEPERS (Signed up, never uploaded)
⚠️ AT RISK (Paid, declining usage)
⭐ POWER USERS (High engagement, paid, advocates)
💀 CHURNED (Canceled, identify why)
```

---

### 2.2 Conversion Triggers (NEW)

**File:** `app/admin/triggers/page.tsx`

#### Automated Actions:

**Trigger: User hits 80% storage**
```
→ Tag user as "storage_warning"
→ Send email: "You're running low on space"
→ Show banner in their dashboard
→ Log to conversion_events table
```

**Trigger: User creates 3rd gallery on free plan**
```
→ Tag user as "engaged_free"
→ Send email: "Unlock unlimited galleries"
→ Show upgrade modal on next login
```

**Trigger: User shares gallery for first time**
```
→ Tag user as "active_sharer"
→ Send email: "Your clients will love this feature..."
→ Highlight premium sharing features
```

**Trigger: Paid user inactive 14 days**
```
→ Tag user as "churn_risk"
→ Send email: "We miss you"
→ Alert admin for personal outreach
→ Offer temporary discount
```

---

## Phase 3: Control Systems

### 3.1 Feature Flags

**File:** `app/admin/flags/page.tsx`

#### Features:

**Flag Types:**
- **Boolean** - On/Off for everyone
- **Percentage** - Roll out to X% of users
- **User List** - Specific user IDs
- **Plan Based** - Only for certain plans
- **Date Range** - Active between dates

**Use Cases:**
```
- Beta test new gallery viewer with 10% of Pro users
- Kill switch for problematic feature
- Holiday promotion banner
- A/B test pricing page
- Gradual rollout of new upload system
```

**Database Schema:**
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  flag_type TEXT NOT NULL, -- boolean, percentage, user_list, plan_based
  is_enabled BOOLEAN DEFAULT false,
  percentage INTEGER, -- for percentage rollout
  target_plans TEXT[], -- for plan_based
  target_users UUID[], -- for user_list
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

**Client-Side Usage:**
```typescript
// In any component
const { isEnabled } = useFeatureFlag('new_gallery_viewer')

if (isEnabled) {
  return <NewGalleryViewer />
} else {
  return <LegacyGalleryViewer />
}
```

---

### 3.2 Admin Settings

**File:** `app/admin/settings/page.tsx`

#### Sections:

**Platform Settings**
- Site name, tagline
- Default timezone
- Support email

**Maintenance Mode**
- Toggle on/off
- Custom message
- Bypass for admins
- Scheduled maintenance windows

**Default Limits**
- Override plan limits globally
- Set default trial period
- Configure grace period for expired plans

**Email Configuration**
- Sender name
- Reply-to address
- Email footer text
- Unsubscribe handling

**Security Settings**
- Session timeout
- Max login attempts
- IP allowlist for admin
- 2FA enforcement for admins

**Integrations**
- Stripe webhook status
- Resend API status
- Supabase connection health
- Storage bucket status

---

## Phase 4: Predictive Analytics (Future)

### 4.1 Churn Prediction Model

**Signals that predict churn:**
- Declining login frequency
- Fewer galleries created
- No shares in 30 days
- Support tickets about billing
- Viewed cancellation page

**Output:**
- Churn probability score (0-100%)
- Days until likely churn
- Recommended intervention

### 4.2 Upgrade Prediction Model

**Signals that predict upgrade:**
- Approaching storage limit
- High gallery count
- Frequent sharing
- Client portal usage
- Contract feature usage

**Output:**
- Upgrade probability score
- Best plan recommendation
- Optimal time to reach out

---

## Implementation Stages

### Stage 1: Foundation (This Session)
**Estimated Time:** 2-3 hours

| Task | Priority | Files |
|------|----------|-------|
| Galleries page - full build | HIGH | `app/admin/galleries/page.tsx`, server actions |
| Storage page - full build | HIGH | `app/admin/storage/page.tsx`, server actions |
| Database migrations | HIGH | `058-admin-galleries.sql`, `059-admin-storage.sql` |
| Documentation | HIGH | Update this doc with completion status |

### Stage 2: Control Systems (Next Session)
**Estimated Time:** 2-3 hours

| Task | Priority | Files |
|------|----------|-------|
| Feature flags - full build | MEDIUM | `app/admin/flags/page.tsx`, migration, client hook |
| Admin settings - full build | MEDIUM | `app/admin/settings/page.tsx`, migration |
| Documentation | HIGH | Update docs |

### Stage 3: Conversion Engine (Future Session)
**Estimated Time:** 3-4 hours

| Task | Priority | Files |
|------|----------|-------|
| Analytics dashboard | HIGH | `app/admin/analytics/page.tsx` |
| Conversion triggers | HIGH | `app/admin/triggers/page.tsx` |
| User scoring system | MEDIUM | Server-side calculations |
| Automated segments | MEDIUM | Cron jobs, email integration |

### Stage 4: Predictive Layer (Future Session)
**Estimated Time:** 4-5 hours

| Task | Priority | Files |
|------|----------|-------|
| Churn prediction | LOW | ML model or rule-based |
| Upgrade prediction | LOW | ML model or rule-based |
| Dashboard integration | LOW | Surface predictions in UI |

---

## Technical Standards

### Code Quality
- TypeScript strict mode
- Server components where possible
- Server actions for mutations
- Proper error handling with try/catch
- Loading states for all async operations
- Mobile-responsive design

### Security
- All admin routes protected by middleware
- All actions require capability check
- All mutations logged to audit trail
- No client-side admin state

### Performance
- Pagination for all lists (50 items default)
- Lazy loading for images
- Debounced search inputs
- Optimistic UI updates

### Design
- Stone palette (per your preferences)
- No sparkle/star icons
- Minimal, editorial aesthetic
- Consistent with existing admin pages

---

## Success Metrics

After implementation, you should be able to:

1. **Find any gallery** in < 5 seconds
2. **Identify upgrade candidates** with one click
3. **See storage health** at a glance
4. **Toggle features** without code deployment
5. **Put site in maintenance** instantly
6. **Track every admin action** for compliance

---

## Approval Checklist

Before proceeding, please confirm:

- [ ] Phase 1 scope is correct (Galleries + Storage)
- [ ] Feature list matches your expectations
- [ ] Priority order is acceptable
- [ ] Technical approach is approved
- [ ] Ready to begin Stage 1

---

## Next Steps

Upon approval:

1. Create database migrations
2. Build server actions for data fetching
3. Build Galleries page with full functionality
4. Build Storage page with full functionality
5. Update documentation with completion status
6. Test all features
7. Deploy

---

**Awaiting your approval to proceed.**

