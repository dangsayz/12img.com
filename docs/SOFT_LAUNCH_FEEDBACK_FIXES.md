# Soft Launch Feedback Fixes (Dec 10, 2024)

## Feedback Sources
- Facebook: Wedding Videographers | Photographers | Second Shooters and Editors Network
- Reddit: r/WeddingPhotography

## Key Objections Identified

| Objection | Root Cause | Fix Applied |
|-----------|------------|-------------|
| "$54/month, not $30/yr" | Promo page didn't show price comparison | Added strikethrough $449/year → Save $419 |
| "Hard drive is $70-90" | Value prop unclear (storage vs experience) | Added "Why not just use a hard drive?" section |
| "Bait and switch" / "$30 this year, $648 next" | No trust signals about price locking | Added "Price locked forever" messaging everywhere |
| "Brand new website" | No transparency about being new | Added "Yes, we're new. Here's why that's good." section |
| "It's $30/month when you checkout" | Confusion between monthly/annual | Clarified pricing display |

## Files Changed

### 1. Promo Landing Page (`app/promo/[code]/PromoLandingClient.tsx`)
- Added price comparison: `$449/year → Save $419`
- Added "What you get" breakdown box:
  - 2TB storage (~800,000 photos)
  - Unlimited galleries (no expiry)
  - Smart contracts (e-sign, client portal)
  - Client delivery (beautiful galleries)
- Added "Price locked forever — renews at $30/year" trust badge
- Added FAQ section addressing:
  - "Will the price increase next year?" → No, locked forever
  - "Why not just use a hard drive?" → Experience vs storage
  - "What happens after 100 spots?" → Price ends for new users
  - "Can I cancel anytime?" → Yes, no fees

### 2. Landing Page (`components/landing/LandingPage.tsx`)
- Added "Price locked on signup" to pricing section value props
- Added "Why not just use a hard drive?" section with 4 cards:
  - Client Experience (branded galleries vs Dropbox)
  - Contracts & Messaging (all-in-one)
  - Track Everything (email opens, views, downloads)
  - No IT Headaches (no backups, no drive failures)
- Added "Transparency" section:
  - "Yes, we're new. Here's why that's good for you."
  - Real humans answer support
  - Feature requests ship fast
  - Founder pricing locked forever

### 3. Pricing Page (`app/pricing/page.tsx`)
- Changed trust badges header: "Trusted by photographers" → "Your price is protected"
- Added "Price Locked Forever" badge
- Added "No Surprise Price Hikes" badge
- Added "Price Lock Guarantee" callout box with explicit promise

## Messaging Framework

### Price Lock Guarantee (use consistently)
> "The price you sign up at is the price you pay forever. No surprise increases at renewal."

### Hard Drive Objection Response
> "A hard drive stores files. 12img delivers experiences."

### New Company Response
> "We launched in 2024 because we saw photographers paying $50+/month for bloated software they barely use."

## Next Steps
1. Monitor next round of feedback
2. Consider adding testimonials/social proof when available
3. Track conversion rate changes
4. A/B test different trust messaging

## Psychology Applied
- **Loss aversion**: "Lock in this price forever"
- **Social proof**: "Join thousands of creatives" (update with real numbers)
- **Transparency**: Acknowledge being new, turn it into advantage
- **Value framing**: Compare to experience, not storage
- **Objection handling**: FAQ directly addresses Reddit/FB comments
