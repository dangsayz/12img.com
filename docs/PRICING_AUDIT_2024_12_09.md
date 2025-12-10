# Pricing Audit Report - December 9, 2024

## Executive Summary
Audit of 12img pricing page promises vs actual code enforcement.
Multiple critical gaps found where limits are defined but NOT enforced.

---

## 🔴 CRITICAL ISSUES FOUND

### Issue #1: Contract Limits NOT Enforced
**Location:** `server/actions/contract.actions.ts` - `createContract()`
**Problem:** Function creates contracts without checking plan limits
**Promised Limits:**
- Free: 1 contract/month (trial)
- Essential: 5 contracts/month
- Pro: 15 contracts/month
- Studio: 50 contracts/month
- Elite: Unlimited

**Evidence:** Free user "dnrottweilers" has 3 contracts (should be max 1)
**Status:** 🔧 FIXING

---

### Issue #2: Pricing Config Inconsistency
**Location:** `lib/config/pricing-v2.ts` lines 47-48 vs 323
**Problem:** Conflicting definitions for Free tier
- Line 47: `contractsPerMonth: 1` (allows 1 contract)
- Line 323: Smart Contracts = `excluded` for Free

**Decision:** Free tier gets 1 TRIAL contract to test the feature
**Status:** 🔧 FIXING - Will update feature matrix to show "1 trial"

---

### Issue #3: Vendor Share Limits - ALREADY WORKING ✅
**Location:** `server/actions/vendor.actions.ts` - `shareGalleryWithVendor()`
**Finding:** Limits ARE enforced via `getVendorLimits()` check (lines 505-509)
**Limits defined in:** `lib/vendors/types.ts` - `VENDOR_PLAN_LIMITS`
- Free: 3 vendors, 3 shares/month
- Essential: 15 vendors, 15 shares/month
- Pro: 50 vendors, 50 shares/month
- Studio/Elite: Unlimited

**Status:** ✅ ALREADY WORKING

---

### Issue #4: Gallery Limits - ALREADY WORKING ✅
**Location:** `server/actions/gallery.actions.ts` - `createGallery()`
**Finding:** Limits ARE enforced (lines 30-44)
**Promised Limits:**
- Free: 3 galleries
- All others: Unlimited

**Status:** ✅ ALREADY WORKING

---

## 🟢 WHAT'S WORKING

### Storage Limits
- Enforced via Supabase storage policies
- Dashboard shows usage vs limit
- Upload blocked when over limit

### Workflow Limits
- Defined in `lib/workflows/types.ts` - `WORKFLOW_PLAN_LIMITS`
- Enforced in `server/actions/workflow.actions.ts`
- Free: 3 active, 0 custom templates
- Essential: 10 active, 3 custom templates
- Pro+: Unlimited

---

## 📝 FIXES APPLIED

### Fix #1: Contract Limit Enforcement
**File:** `server/actions/contract.actions.ts`
**Change:** Added contract count check before creation
```typescript
// Get contract count for this month
const startOfMonth = new Date()
startOfMonth.setDate(1)
startOfMonth.setHours(0, 0, 0, 0)

const { count: contractsThisMonth } = await supabaseAdmin
  .from('contracts')
  .select('*', { count: 'exact', head: true })
  .eq('photographer_id', user.id)
  .gte('created_at', startOfMonth.toISOString())

// Check plan limit
const userPlan = user.subscription_plan || 'free'
if (!canCreateContract(userPlan as PlanTier, contractsThisMonth || 0)) {
  return { 
    success: false, 
    error: userError('LIMIT_REACHED', `You've reached your monthly contract limit. Upgrade your plan for more contracts.`)
  }
}
```

### Fix #2: Update Free Tier Feature Display
**File:** `lib/config/pricing-v2.ts`
**Change:** Updated Smart Contracts to show "1 trial" for Free tier
```typescript
// Before
free: { status: 'excluded' }

// After  
free: { status: 'limited', note: '1 trial', tooltip: 'Try the feature with 1 contract' }
```

### Fix #3: Vendor Share Limit Enforcement
**File:** `server/actions/vendor.actions.ts`
**Status:** NO FIX NEEDED - Already implemented!
```typescript
// Already exists at lines 505-509:
const limits = await getVendorLimits()
if (!limits.canShareGallery) {
  throw new Error('Monthly share limit reached for your plan')
}
```

---

## 📊 FINAL PRICING MATRIX (After Fixes)

| Feature | Free | Essential ($6) | Pro ($12) | Studio ($18) | Elite ($30) |
|---------|------|----------------|-----------|--------------|-------------|
| Storage | 2GB | 10GB | 100GB | 500GB | 2TB |
| Galleries | 3 | Unlimited | Unlimited | Unlimited | Unlimited |
| Contracts/Month | 1 trial | 5 | 15 | 50 | Unlimited |
| Workflows | 3 | 10 | Unlimited | Unlimited | Unlimited |
| Custom Templates | 0 | 3 | Unlimited | Unlimited | Unlimited |
| Vendors | 3 | 15 | 50 | Unlimited | Unlimited |
| Vendor Shares/Mo | 3 | 15 | 50 | Unlimited | Unlimited |
| Client Portal | ✅ | ✅ | ✅ | ✅ | ✅ |
| Messaging | ✅ | ✅ | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 🔄 ROLLBACK INSTRUCTIONS

If issues occur after these fixes:

### Rollback Contract Limits
Remove the contract count check block in `createContract()` (lines XX-XX)

### Rollback Vendor Limits
Remove `VENDOR_PLAN_LIMITS` and the check in `shareGalleryWithVendor()`

### Rollback Feature Matrix
Revert `smart_contracts` free tier to `{ status: 'excluded' }`

---

## 📁 Files Modified
1. `server/actions/contract.actions.ts` - Added contract limit enforcement (lines 202-229)
2. `lib/config/pricing-v2.ts` - Updated Smart Contracts feature to show limits per plan (lines 322-328)
3. `docs/PRICING_AUDIT_2024_12_09.md` - This audit document

## 📁 Files Already Working (No Changes Needed)
1. `server/actions/vendor.actions.ts` - Vendor limits already enforced (lines 505-509)
2. `server/actions/gallery.actions.ts` - Gallery limits already enforced (lines 30-44)
3. `lib/vendors/types.ts` - VENDOR_PLAN_LIMITS already defined (lines 390-416)
4. `lib/workflows/types.ts` - WORKFLOW_PLAN_LIMITS already defined

---

## ✅ VERIFICATION CHECKLIST
- [ ] Free user cannot create more than 1 contract/month
- [ ] Essential user cannot create more than 5 contracts/month
- [ ] Pro user cannot create more than 15 contracts/month
- [ ] Free user cannot share with more than 3 vendors (ALREADY WORKS)
- [ ] Free user cannot create more than 3 galleries (ALREADY WORKS)
- [ ] Error message shows when limit reached
- [ ] Existing contracts still work (no breaking changes)

---

*Audit performed by Cascade AI - December 9, 2024*
