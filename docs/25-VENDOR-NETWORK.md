# 25. Vendor Network

## Overview

The Vendor Network feature enables photographers to build professional relationships with event vendors (florists, planners, venues, caterers, etc.) by sharing curated galleries with usage terms, growing referrals and exposure.

## Value Proposition

- **For Photographers**: Grow your network, get tagged on social media, receive referrals
- **For Vendors**: Access professional photos of their work for marketing
- **Control**: Photographers maintain full control over which images are shared and usage terms

---

## Database Schema

### Table 1: `vendors`
The photographer's vendor network.

```sql
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Vendor Info
    business_name TEXT NOT NULL,
    category TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    instagram_handle TEXT,
    website TEXT,
    
    -- Branding
    logo_url TEXT,
    color TEXT,  -- Hex color for avatar fallback
    
    -- Notes
    notes TEXT,
    
    -- Status
    is_archived BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table 2: `vendor_terms_templates`
Reusable media usage terms.

```sql
CREATE TABLE public.vendor_terms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_system BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table 3: `gallery_vendor_shares`
Links between galleries and vendors.

```sql
CREATE TABLE public.gallery_vendor_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    
    -- Share Configuration
    share_type TEXT NOT NULL DEFAULT 'entire',  -- 'entire', 'selected'
    terms_template_id UUID REFERENCES public.vendor_terms_templates(id) ON DELETE SET NULL,
    
    -- Access Token
    access_token TEXT NOT NULL UNIQUE,
    
    -- Tracking
    shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    downloaded_at TIMESTAMPTZ,
    terms_accepted_at TIMESTAMPTZ,
    
    UNIQUE(gallery_id, vendor_id)
);
```

### Table 4: `gallery_vendor_images`
Selected images for partial shares.

```sql
CREATE TABLE public.gallery_vendor_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES public.gallery_vendor_shares(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
    
    UNIQUE(share_id, image_id)
);
```

---

## Vendor Categories

| Category | Icon | Color |
|----------|------|-------|
| `florist` | 🌸 | Pink |
| `planner` | 💎 | Purple |
| `venue` | 🏛️ | Stone |
| `dj` | 🎵 | Blue |
| `caterer` | 🍽️ | Orange |
| `bakery` | 🎂 | Amber |
| `rentals` | 🪑 | Teal |
| `hair_makeup` | 💄 | Rose |
| `videographer` | 🎬 | Indigo |
| `officiant` | 📜 | Slate |
| `transportation` | 🚗 | Gray |
| `other` | ✨ | Stone |

---

## Plan Limits

| Plan | Max Vendors | Shares/Month | Terms Templates |
|------|-------------|--------------|-----------------|
| Free | 3 | 3 | 1 (default only) |
| Essential | 15 | 15 | 3 |
| Pro | 50 | 50 | 10 |
| Studio | Unlimited | Unlimited | Unlimited |
| Elite | Unlimited | Unlimited | Unlimited |

---

## Routes

| Route | Purpose |
|-------|---------|
| `/settings/vendors` | Vendor directory |
| `/gallery/[id]` → Vendors tab | Gallery vendor sharing |
| `/vendor/[token]` | Public vendor portal |

---

## User Flows

### Adding a Vendor
1. Go to Settings → Vendors
2. Click "Add Vendor"
3. Fill in: Business Name, Category, Instagram (optional), Email (optional)
4. Save → Vendor appears in directory

### Sharing a Gallery with Vendor
1. Open gallery editor
2. Go to "Vendors" tab
3. Click "Share with Vendor"
4. Select vendor from dropdown
5. Choose: Entire Gallery or Select Images
6. Choose terms template (or use default)
7. Click "Share" → Link generated

### Vendor Viewing Shared Gallery
1. Vendor receives link (via email/text from photographer)
2. Opens `/vendor/[token]`
3. Sees gallery images
4. Must accept terms before downloading
5. Can download individual images or ZIP

---

## Components

### Vendor Directory (`/settings/vendors`)
- Grid of vendor cards
- Search/filter by category
- Add/Edit/Archive actions
- Empty state with CTA

### Vendor Card
- Avatar (logo or initials with category color)
- Business name
- Category badge
- Instagram link
- Share count

### Gallery Vendors Tab
- List of current shares
- "Share with Vendor" button
- Share status (viewed, downloaded, terms accepted)
- Copy link / Revoke actions

### Vendor Portal
- Gallery title + photographer branding
- Image grid (masonry)
- Terms acceptance modal
- Download buttons (individual + ZIP)

---

## Server Actions

```typescript
// Vendor CRUD
getVendors(userId: string): Promise<Vendor[]>
getVendor(vendorId: string): Promise<Vendor>
createVendor(data: CreateVendorInput): Promise<Vendor>
updateVendor(vendorId: string, data: UpdateVendorInput): Promise<Vendor>
archiveVendor(vendorId: string): Promise<void>

// Terms Templates
getTermsTemplates(userId: string): Promise<TermsTemplate[]>
createTermsTemplate(data: CreateTermsInput): Promise<TermsTemplate>
updateTermsTemplate(id: string, data: UpdateTermsInput): Promise<TermsTemplate>
deleteTermsTemplate(id: string): Promise<void>
setDefaultTermsTemplate(id: string): Promise<void>

// Gallery Sharing
getGalleryVendorShares(galleryId: string): Promise<GalleryVendorShare[]>
shareGalleryWithVendor(data: ShareInput): Promise<GalleryVendorShare>
updateGalleryVendorShare(shareId: string, data: UpdateShareInput): Promise<void>
revokeGalleryVendorShare(shareId: string): Promise<void>

// Vendor Portal (public)
getVendorShareByToken(token: string): Promise<VendorShareWithImages>
acceptVendorTerms(token: string): Promise<void>
trackVendorView(token: string): Promise<void>
trackVendorDownload(token: string): Promise<void>

// Limits
getVendorLimits(userId: string): Promise<VendorLimits>
```

---

## System Terms Template

**Name:** Standard Media Usage Terms

**Content:**
```
MEDIA USAGE AGREEMENT

By downloading these images, you agree to the following terms:

1. CREDIT REQUIRED: You must credit [Photographer Name] when posting these images on social media or any public platform. Tag @[photographer_instagram] where possible.

2. NO EDITING: Images may not be edited, filtered, cropped, or altered in any way without written permission.

3. NO COMMERCIAL USE: Images are for your portfolio and social media only. They may not be used in paid advertising without written permission.

4. NO TRANSFER: You may not share, sell, or transfer these images to third parties.

5. REMOVAL REQUEST: The photographer reserves the right to request removal of any posted images at any time.

By downloading, you acknowledge and accept these terms.
```

---

## Implementation Checklist

### Phase 1: Database & Types
- [ ] Create migration `055-vendor-network.sql`
- [ ] Create `lib/vendors/types.ts`
- [ ] Update `lib/config/pricing-v2.ts` with limits

### Phase 2: Server Actions
- [ ] Create `server/actions/vendor.actions.ts`
- [ ] Vendor CRUD operations
- [ ] Terms template operations
- [ ] Gallery sharing operations
- [ ] Vendor portal operations

### Phase 3: Vendor Directory UI
- [ ] Create `/settings/vendors/page.tsx`
- [ ] Create `VendorList.tsx`
- [ ] Create `VendorCard.tsx`
- [ ] Create `AddVendorModal.tsx`
- [ ] Create `EditVendorModal.tsx`

### Phase 4: Gallery Integration
- [ ] Add Vendors tab to gallery editor
- [ ] Create `VendorShareModal.tsx`
- [ ] Create `ImageSelector.tsx` (for partial shares)
- [ ] Create `VendorShareList.tsx`

### Phase 5: Vendor Portal
- [ ] Create `/vendor/[token]/page.tsx`
- [ ] Create `VendorPortalClient.tsx`
- [ ] Create `TermsAcceptanceModal.tsx`
- [ ] Implement download (individual + ZIP)

### Phase 6: Polish
- [ ] Add to pricing matrix
- [ ] Add to landing page features
- [ ] Email notification when vendor views/downloads
- [ ] Empty states and loading states

---

## Future Enhancements (Not in Scope)

- QR code generation for events
- AI-powered image selection
- Vendor self-registration links
- Social media post tracking
- Vendor ratings/reviews
