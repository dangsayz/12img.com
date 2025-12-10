# 12img Promotional Deals System

## Overview

A complete system for running time-limited promotional campaigns from the admin panel, with automatic landing page integration and shareable links.

---

## Research-Backed Conversion Psychology

### Key Findings

| Tactic | Conversion Impact | Source |
|--------|------------------|--------|
| **Countdown timers** | +25-40% signup velocity | Orbix Studio |
| **Authentic scarcity** | +31% trial signups | SaaS Pricing Psychology |
| **Founding member pricing** | 2x commitment rate | Early Stage Marketing |
| **Loss aversion framing** | Losses weighted 2x gains | Behavioral Economics |
| **Center stage effect** | +15-20% on highlighted plan | ScaleCrush |

### Rules for Maximum Conversion

1. **Never fake scarcity** — Users detect manipulation, destroys trust permanently
2. **Use sparingly** — Discounts must feel exceptional, once-in-a-lifetime
3. **Double urgency** — Combine quantity limit + time limit
4. **Anchor high** — Show original price crossed out
5. **Charm pricing** — $29, $37, $47 (not round numbers)

---

## Stripe Setup Required

### Step 1: Create Promotional Prices in Stripe

Go to Stripe Dashboard → Products → Add Price for each promo:

#### Founder's Elite (First 100)
```
Product: Elite Plan
Price nickname: founders_elite_annual
Amount: $30.00 (one-time) OR $30.00/year
Metadata:
  - promo_code: FOUNDER100
  - plan: elite
  - promo_type: founders
```

#### Annual Deals (Create for each plan)
```
Starter Annual: $59/year (already exists)
Pro Annual: $159/year (already exists)
Studio Annual: $289/year (already exists)
Elite Annual: $449/year (already exists)
```

#### Holiday Promos (Create as needed)
```
Product: Pro Plan
Price nickname: blackfriday_pro_annual
Amount: $99/year (37% off $159)
Metadata:
  - promo_code: BLACKFRIDAY2025
  - plan: pro
  - promo_type: holiday
  - expires: 2025-12-02
```

### Step 2: Create Stripe Coupons

Dashboard → Coupons → Create:

| Coupon ID | Type | Amount | Duration | Redemption Limit |
|-----------|------|--------|----------|------------------|
| `FOUNDER100` | Percent | 44% off | First year | 100 |
| `BLACKFRIDAY50` | Percent | 50% off | First year | Unlimited |
| `NEWYEAR40` | Percent | 40% off | First year | Unlimited |
| `SUMMER30` | Percent | 30% off | 3 months | Unlimited |
| `WEDDING25` | Percent | 25% off | Forever | 500 |

---

## Promotional Calendar 2025

### Tier 1: Major Campaigns (40-50% off)

| Campaign | Dates | Discount | Target Plan | Psychology |
|----------|-------|----------|-------------|------------|
| **Founder's 100** | Launch - Until filled | 44% off Elite ($30/yr) | Elite | Scarcity + Exclusivity |
| **Black Friday** | Nov 24-Dec 2 | 50% off Annual | All paid | Loss aversion |
| **Cyber Monday** | Dec 1-2 | 50% off Annual | All paid | Urgency |
| **New Year** | Dec 26-Jan 7 | 40% off Annual | All paid | Fresh start |

### Tier 2: Seasonal Campaigns (25-35% off)

| Campaign | Dates | Discount | Target | Copy Hook |
|----------|-------|----------|--------|-----------|
| **Wedding Season** | Feb 1-28 | 30% off Pro+ | Pro, Studio | "Book more weddings" |
| **Spring Refresh** | Mar 15-31 | 25% off | All paid | "Spring clean your workflow" |
| **Summer Rush** | Jun 1-15 | 30% off | Pro, Studio | "Peak season prep" |
| **Back to Business** | Sep 1-15 | 25% off | All paid | "Fall booking season" |

### Tier 3: Micro-Campaigns (15-20% off)

| Campaign | Date | Discount | Hook |
|----------|------|----------|------|
| **Valentine's Day** | Feb 10-14 | 20% off | "Love your workflow" |
| **Mother's Day** | May 5-11 | 20% off | "For photographers who capture love" |
| **World Photo Day** | Aug 19 | 25% off | "Celebrate your craft" |
| **Small Biz Saturday** | Nov 29 | 30% off | "Support indie photographers" |

### Tier 4: Evergreen Promos

| Promo | Trigger | Discount | Limit |
|-------|---------|----------|-------|
| **Annual Switch** | Monthly user, 3+ months | 2 months free | Per user |
| **Referral Reward** | Successful referral | 1 month free | Unlimited |
| **Comeback** | Churned 60+ days | 40% off 3 months | Per user |

---

## Database Schema

```sql
-- Migration: 061-promotional-deals.sql

-- Promotional campaigns table
CREATE TABLE promotional_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Limits
  max_redemptions INTEGER, -- NULL = unlimited
  current_redemptions INTEGER DEFAULT 0,
  
  -- Targeting
  target_plans TEXT[] DEFAULT ARRAY['pro', 'studio', 'elite'],
  new_users_only BOOLEAN DEFAULT false,
  
  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'price_override')),
  discount_value INTEGER NOT NULL, -- Percent (0-100) or cents
  discount_duration TEXT DEFAULT 'once' CHECK (discount_duration IN ('once', 'forever', 'repeating')),
  discount_months INTEGER, -- For repeating
  
  -- Stripe
  stripe_coupon_id TEXT,
  stripe_price_ids JSONB, -- { "pro": "price_xxx", "studio": "price_yyy" }
  
  -- Display
  badge_text TEXT, -- "50% OFF", "FOUNDER PRICING"
  banner_headline TEXT,
  banner_subheadline TEXT,
  banner_cta TEXT DEFAULT 'Claim Deal',
  banner_bg_color TEXT DEFAULT '#141414',
  banner_text_color TEXT DEFAULT '#FFFFFF',
  show_countdown BOOLEAN DEFAULT true,
  show_spots_remaining BOOLEAN DEFAULT false,
  
  -- Landing page
  show_on_landing BOOLEAN DEFAULT true,
  show_on_pricing BOOLEAN DEFAULT true,
  landing_position TEXT DEFAULT 'hero' CHECK (landing_position IN ('hero', 'above_pricing', 'floating')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign redemptions tracking
CREATE TABLE campaign_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  email TEXT, -- For pre-signup tracking
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_subscription_id TEXT,
  plan TEXT,
  amount_saved INTEGER, -- In cents
  
  UNIQUE(campaign_id, user_id)
);

-- Shareable promo links
CREATE TABLE promo_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL, -- Short code for URL
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaigns_active ON promotional_campaigns(is_active, starts_at, ends_at);
CREATE INDEX idx_campaigns_slug ON promotional_campaigns(slug);
CREATE INDEX idx_redemptions_campaign ON campaign_redemptions(campaign_id);
CREATE INDEX idx_promo_links_code ON promo_links(code);

-- Helper functions
CREATE OR REPLACE FUNCTION get_active_campaign()
RETURNS promotional_campaigns AS $$
  SELECT * FROM promotional_campaigns
  WHERE is_active = true
    AND NOW() >= starts_at
    AND NOW() <= ends_at
    AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)
  ORDER BY 
    CASE WHEN max_redemptions IS NOT NULL THEN 0 ELSE 1 END, -- Scarcity first
    discount_value DESC -- Then biggest discount
  LIMIT 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION increment_campaign_redemption(campaign_slug TEXT)
RETURNS void AS $$
  UPDATE promotional_campaigns
  SET current_redemptions = current_redemptions + 1,
      updated_at = NOW()
  WHERE slug = campaign_slug;
$$ LANGUAGE sql;

-- RLS
ALTER TABLE promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_links ENABLE ROW LEVEL SECURITY;

-- Public can read active campaigns
CREATE POLICY "Anyone can view active campaigns"
  ON promotional_campaigns FOR SELECT
  USING (is_active = true AND NOW() >= starts_at AND NOW() <= ends_at);

-- Admins can do everything
CREATE POLICY "Admins can manage campaigns"
  ON promotional_campaigns FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage redemptions"
  ON campaign_redemptions FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage promo links"
  ON promo_links FOR ALL
  USING (is_admin(auth.uid()));
```

---

## Shareable Links Format

### Direct Promo Links
```
https://12img.com/promo/FOUNDER100
https://12img.com/promo/BLACKFRIDAY
https://12img.com/promo/NEWYEAR2025
```

### UTM-Tagged Links (for tracking)
```
https://12img.com/promo/FOUNDER100?utm_source=instagram&utm_medium=bio&utm_campaign=launch
https://12img.com/promo/BLACKFRIDAY?utm_source=email&utm_medium=newsletter&utm_campaign=bf2025
```

### Plan-Specific Links
```
https://12img.com/sign-up?plan=elite&promo=FOUNDER100
https://12img.com/sign-up?plan=pro&promo=BLACKFRIDAY
```

---

## Admin Panel Features

### Campaign Management (`/admin/promos`)

1. **Campaign List**
   - Active/Scheduled/Ended tabs
   - Quick stats: redemptions, revenue, conversion rate
   - One-click activate/deactivate

2. **Create Campaign**
   - Name, slug, description
   - Date range picker
   - Discount configuration
   - Target plans checkboxes
   - Stripe coupon selector
   - Banner customization
   - Preview mode

3. **Campaign Detail**
   - Real-time redemption counter
   - Revenue generated
   - Conversion funnel
   - Shareable links generator
   - Copy-paste social posts

### Quick Actions

- **Copy Link** — One-click copy promo URL
- **Generate Social Post** — Pre-written copy for Instagram/Twitter
- **Email Template** — HTML email ready to send
- **Extend Campaign** — Quick date extension
- **Pause Campaign** — Immediate deactivation

---

## Landing Page Integration

### Hero Banner (Floating)

```tsx
// When active campaign exists
<PromoBanner 
  position="top" // or "floating"
  campaign={activeCampaign}
/>

// Renders:
┌─────────────────────────────────────────────────────────────┐
│ 🎉 FOUNDER PRICING: First 100 get Elite for $30/yr (44% off)│
│ [73 spots left] [Claim Now →]                    [Ends in 5d]│
└─────────────────────────────────────────────────────────────┘
```

### Pricing Section Override

```tsx
// Normal price display
$54/mo

// With active promo
<s className="text-stone-400">$54</s>
<span className="text-emerald-600 font-bold">$30</span>
<span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 ml-2">
  44% OFF
</span>
```

### Countdown Timer

```tsx
<CountdownTimer 
  endsAt={campaign.ends_at}
  showDays={true}
  urgencyThreshold={24} // Hours - turns red when < 24h
/>
```

### Spots Remaining

```tsx
<SpotsRemaining 
  total={100}
  remaining={campaign.max_redemptions - campaign.current_redemptions}
  urgencyThreshold={20} // Turns red when < 20 spots
/>
```

---

## Pre-Written Copy for Each Campaign

### Founder's 100

**Instagram Bio Link:**
```
🚀 First 100 photographers get Elite for $30/year (normally $449)
→ 12img.com/promo/FOUNDER100
```

**Twitter/X:**
```
Launching @12img — gallery delivery for photographers who hate clunky software.

First 100 get Elite tier for $30/year (normally $449).
2TB storage. Unlimited everything.

Claim yours: 12img.com/promo/FOUNDER100

[73 spots left]
```

**Email Subject Lines:**
- "You're invited: Founder pricing for 12img"
- "73 spots left at $30/year"
- "Last chance: Founder pricing closes tomorrow"

### Black Friday

**Instagram:**
```
BLACK FRIDAY: 50% off all annual plans 🖤

Pro: $159 → $79/year
Studio: $289 → $144/year
Elite: $449 → $224/year

Ends Monday midnight.
→ 12img.com/promo/BLACKFRIDAY
```

**Email Subject Lines:**
- "50% off everything (Black Friday only)"
- "⏰ 48 hours left: Half-price annual plans"
- "Final hours: Black Friday ends at midnight"

### Wedding Season

**Instagram:**
```
Wedding season is coming. Is your delivery workflow ready?

30% off Pro & Studio plans through February.
→ 12img.com/promo/WEDDING25

Book more. Deliver faster. Look professional.
```

---

## Implementation Checklist

### Phase 1: Database & Backend
- [ ] Create migration `061-promotional-deals.sql`
- [ ] Create `lib/promos/types.ts`
- [ ] Create `server/actions/promo.actions.ts`
- [ ] Create `server/admin/promos.ts`
- [ ] Add API route `/api/promo/active`
- [ ] Add promo page `/promo/[code]/page.tsx`

### Phase 2: Admin Panel
- [ ] Create `/admin/promos/page.tsx`
- [ ] Create `PromoList.tsx` component
- [ ] Create `CreatePromoModal.tsx`
- [ ] Create `PromoDetail.tsx` with stats
- [ ] Add link generator with copy button
- [ ] Add social post generator

### Phase 3: Landing Page
- [ ] Create `PromoBanner.tsx` component
- [ ] Create `CountdownTimer.tsx`
- [ ] Create `SpotsRemaining.tsx`
- [ ] Integrate with `PricingSection.tsx`
- [ ] Add promo query param handling to sign-up

### Phase 4: Stripe Integration
- [ ] Create promotional prices in Stripe
- [ ] Create coupons in Stripe
- [ ] Update checkout to apply promo
- [ ] Track redemptions on successful payment

### Phase 5: Analytics
- [ ] Track promo link clicks
- [ ] Track conversion funnel
- [ ] Revenue attribution per campaign
- [ ] A/B test banner positions

---

## Founder's 100 — Launch Now

### Immediate Setup

1. **Stripe:** Create coupon `FOUNDER100` — 44% off, first year, limit 100
2. **Database:** Insert campaign record
3. **Landing:** Add floating banner
4. **Share:** Post on socials with link

### Campaign Record

```sql
INSERT INTO promotional_campaigns (
  slug, name, description,
  starts_at, ends_at,
  max_redemptions, target_plans,
  discount_type, discount_value, discount_duration,
  stripe_coupon_id,
  badge_text, banner_headline, banner_subheadline, banner_cta,
  show_countdown, show_spots_remaining,
  is_active
) VALUES (
  'founder100',
  'Founder''s 100',
  'First 100 photographers get Elite for $30/year',
  NOW(),
  NOW() + INTERVAL '90 days',
  100,
  ARRAY['elite'],
  'price_override',
  3000, -- $30.00 in cents
  'once',
  'FOUNDER100',
  '44% OFF',
  'Founder Pricing: Elite for $30/year',
  'First 100 photographers only. 2TB storage. Unlimited everything.',
  'Claim Your Spot',
  false, -- No countdown for scarcity-based
  true,  -- Show spots remaining
  true
);
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Founder's 100 fill rate | < 30 days | Days to 100 redemptions |
| Black Friday conversion | 5%+ | Visitors → Paid |
| Promo revenue lift | +40% | vs. non-promo period |
| Churn on promo users | < 20% | After first year |

---

## Notes

- **Never run overlapping major promos** — Confuses users, dilutes urgency
- **Grandfather promo users** — Don't raise their price unexpectedly
- **Track promo cohorts separately** — They may have different LTV
- **Test banner positions** — Hero vs floating vs above-pricing
- **Mobile-first banners** — Most traffic is mobile
