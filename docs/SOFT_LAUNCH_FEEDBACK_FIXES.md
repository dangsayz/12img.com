# Soft Launch Feedback Fixes (Dec 10, 2024)

## The Lesson

> "Under every insult is a hidden truth."

The internet roasted us. And they were right. Every complaint pointed to a room we hadn't cleaned yet.

## Feedback Sources
- Facebook: Wedding Videographers | Photographers | Second Shooters and Editors Network
- Reddit: r/WeddingPhotography

## What They Said → What We Learned

| What They Said | What It Really Meant | What We Fixed |
|----------------|---------------------|---------------|
| "$54/month, not $30/yr" | **Checkout was literally broken.** Stripe was charging monthly, not the Founder's annual price. | Created $30/year price in Stripe, wired it to Founder's promo code |
| "44% off all plans" | **Founder's coupon was applying to ALL plans**, not just Elite. Starter at $6 became $3.36. | Fixed checkout to only apply Founder's code to Elite plan |
| "Hard drive is $70-90" | **We sold storage, not value.** They didn't understand why cloud beats local. | Added "Why not just use a hard drive?" section explaining client experience, contracts, tracking |
| "Bait and switch" / "$648 next year" | **No trust signals.** Nothing said the price was locked. | Added "Price locked forever" messaging on promo page, pricing page, landing page |
| "Brand new website" | **Being new = suspicious.** We didn't own our story. | Added transparency section: "Yes, we're new. Here's why that's good for you." |
| "It's $30/month at checkout" | **The actual checkout showed wrong price.** This was a real bug, not user error. | Fixed Stripe integration to use annual Founder's price |

## The Brutal Truth

**aygross was RIGHT.** When they said "It's $30 a month when you try to checkout" - that wasn't them misreading. Our checkout was actually showing $54/month because:

1. We only had monthly prices in Stripe
2. The Founder's "coupon" didn't exist
3. The promo code was being ignored

We were literally charging people the wrong price. That's not a messaging problem - that's a broken product.

## Key Objections Identified

| Objection | Root Cause | Fix Applied |
|-----------|------------|-------------|
| "$54/month, not $30/yr" | Promo page didn't show price comparison | Added strikethrough $449/year → Save $419 |
| "Hard drive is $70-90" | Value prop unclear (storage vs experience) | Added "Why not just use a hard drive?" section |
| "Bait and switch" / "$30 this year, $648 next" | No trust signals about price locking | Added "Price locked forever" messaging everywhere |
| "Brand new website" | No transparency about being new | Added "Yes, we're new. Here's why that's good." section |
| "It's $30/month when you checkout" | **ACTUAL BUG** - Stripe had no $30/year price | Created Founder's price in Stripe, updated checkout logic |

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
- **NEW**: Added `ActivePricingPromoBanner` - Promo banner above pricing matrix with:
  - Countdown timer (shows when < 7 days remaining)
  - Spots remaining indicator (with urgency pulse when < 10 spots)
  - Savings highlight ("You save $X/mo")
  - "Price locked forever" soft hint below banner
  - Dismissible (session-based, shows again next visit)

### 4. Pricing Buttons (`components/billing/PricingButton.tsx`)
- Added `showPromoHint` prop to show subtle promo indicator below buttons
- Shows "X% off" or "Promo applied" when user has stored promo code
- Applied to both desktop and mobile pricing matrix buttons

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

---

## Principles for Next Time

### 1. Test the actual checkout flow
Before any promo launch, complete a real checkout with a test card. We would have caught the $54/month bug immediately.

### 2. Assume confusion, not malice
When users say something's wrong, believe them first. aygross wasn't "reading it wrong" - the checkout was broken.

### 3. Every objection is a gift
- "Hard drive is cheaper" → We need to explain value, not storage
- "Bait and switch" → We need trust signals
- "Site is new" → We need to own our story

### 4. Messaging checklist before launch
- [ ] Is the price crystal clear? (amount, period, what's included)
- [ ] Is there a "why not X?" section for obvious alternatives?
- [ ] Are trust signals visible? (price lock, cancel anytime, no CC required)
- [ ] Do we acknowledge being new? (transparency > hiding)
- [ ] Does checkout actually charge the advertised price?

### 5. The feedback loop
```
Complaint → Find the truth → Fix the product → Update the messaging → Document the lesson
```

---

## What We'd Do Differently

1. **Soft launch to 5 people first** - Get real checkout feedback before Reddit
2. **Record a Loom of the full flow** - Watch someone try to buy
3. **Add "What you'll see at checkout" preview** - Set expectations before Stripe
4. **Price lock guarantee on EVERY page** - Not just promo page
5. **Own "we're new" from day 1** - Make it a feature, not a bug
