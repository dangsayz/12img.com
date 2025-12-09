# 12img Plan Rules & Limits

> **Canonical source of truth for plan-based access control**
> 
> Last updated: December 2024

---

## Plan Tiers Overview

| Plan | Monthly | Storage | Galleries | Gallery Expiry |
|------|---------|---------|-----------|----------------|
| **Free** | $0 | 2GB (~1,300 photos) | 3 | 7 days |
| **Essential** | $6 | 10GB (~4,000 photos) | Unlimited | Never |
| **Pro** | $12 | 100GB (~31,000 photos) | Unlimited | Never |
| **Studio** | $18 | 500GB (~151,000 photos) | Unlimited | Never |
| **Elite** | $30 | 2TB (~600,000 photos) | Unlimited | Never |

---

## Feature Access Matrix

### ✅ Available to ALL Plans (including Free)

- **Gallery Features**
  - Create & manage galleries (up to plan limit)
  - All gallery templates (Mosaic, Cinematic, Editorial)
  - Fullscreen image viewer
  - Password protection
  - Download options (individual & bulk ZIP)
  - Email notifications to clients
  
- **Upload & Storage**
  - Bulk upload (up to plan storage limit)
  - Auto image optimization
  - Full resolution downloads for clients

- **Profile**
  - Public photographer profile
  - Portfolio showcase

---

### 🔒 Paid Plans Only (Essential+)

| Feature | Free | Essential | Pro | Studio | Elite |
|---------|------|-----------|-----|--------|-------|
| **Client Management** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Smart Contracts** | 1 trial | 5/mo | 15/mo | 50/mo | Unlimited |
| **Client Portal** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Client Messaging** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Milestone Tracking** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Community Spotlight** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Priority Support** | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Contract Limits by Plan

| Plan | Contracts per Month | Notes |
|------|---------------------|-------|
| **Free** | 1 (trial) | One-time trial to test the feature |
| **Essential** | 5 | Good for part-time photographers |
| **Pro** | 15 | Most popular - handles busy seasons |
| **Studio** | 50 | For busy studios with multiple shooters |
| **Elite** | Unlimited | No limits |

---

## Enforcement Rules

### Gallery Creation
```
IF user.galleryCount >= plan.galleryLimit THEN
  BLOCK creation
  SHOW upgrade prompt
```

### Storage Upload
```
IF (user.storageUsed + newFileSize) > plan.storageLimit THEN
  BLOCK upload
  SHOW storage upgrade prompt
```

### Client Management Access
```
IF plan === 'free' THEN
  SHOW upgrade prompt on /dashboard/clients
  ALLOW viewing but not creating clients
```

### Contract Creation
```
IF plan === 'free' AND user.contractsThisMonth >= 1 THEN
  BLOCK creation
  SHOW "You've used your trial contract"
  
IF plan !== 'free' AND user.contractsThisMonth >= plan.contractLimit THEN
  BLOCK creation
  SHOW "Monthly contract limit reached"
```

### Community Spotlight
```
IF plan === 'free' THEN
  BLOCK voting and submissions
  SHOW upgrade prompt
```

---

## Implementation Files

| Feature | Enforcement Location |
|---------|---------------------|
| Gallery limits | `lib/access/limits.ts` |
| Plan config | `lib/config/pricing-v2.ts` |
| Contract limits | `server/actions/contract.actions.ts` |
| Client access | `app/dashboard/clients/page.tsx` |
| Contest access | `server/actions/contest.actions.ts` |

---

## Free Plan Philosophy

The free plan is designed to:
1. **Let photographers test the platform** - Full gallery features, just limited quantity
2. **Showcase quality** - No feature degradation, just limits
3. **Encourage upgrade** - Natural friction when limits are hit
4. **Trial premium features** - 1 contract to experience the workflow

---

## Upgrade Prompts

When a limit is hit, show contextual upgrade prompts:

- **Gallery limit**: "You've reached your 3 gallery limit. Upgrade to Essential for unlimited galleries."
- **Storage limit**: "Storage full. Upgrade for more space."
- **Contract limit**: "You've used your trial contract. Upgrade to send more."
- **Client access**: "Client management is a paid feature. Upgrade to manage clients."

---

## Database Fields

```sql
-- users table
plan VARCHAR DEFAULT 'free'  -- 'free', 'essential', 'pro', 'studio', 'elite'

-- For contract tracking (add if not exists)
contracts_sent_this_month INTEGER DEFAULT 0
contracts_month_reset_at TIMESTAMP
```

---

## Implementation Status

- [x] Add contract limits to pricing-v2.ts
- [x] Add upgrade prompt to clients page for free users
- [ ] Implement contract limit checking in contract.actions.ts
- [ ] Track monthly contract usage in database
- [ ] Reset contract counts monthly (cron job)
