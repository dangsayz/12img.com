# Promo Banner Mobile Fix

**Date:** December 10, 2024  
**Issue:** Promo modal getting cut off on mobile Safari, text truncated

## Problem

The promotional modal (`PromoModal` in `PromoHint.tsx`) was displaying incorrectly on mobile:
- Modal positioned at fixed `bottom-8` was getting clipped by iOS Safari's bottom toolbar
- Text "First 100 get Elite for $" was being truncated
- Layout wasn't responsive for narrow screens

## Solution

### 1. iOS Safe Area Support

Added `env(safe-area-inset-bottom)` to position the modal above the iOS home indicator:

```tsx
// Before
className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md"

// After
className="fixed left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 sm:w-[90vw] sm:max-w-md"
style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
```

### 2. Viewport Configuration

Added viewport export in `app/layout.tsx` to enable safe area insets:

```tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',  // Required for env(safe-area-inset-*) to work
}
```

### 3. Mobile-First Layout

- **Width:** Full width on mobile (`left-4 right-4`), centered on desktop
- **Text:** Smaller headline on mobile (`text-base sm:text-lg`)
- **Footer:** Stacked vertically on mobile (`flex-col sm:flex-row`)
- **Touch targets:** Larger button padding on mobile (`py-2.5 sm:py-2`)

## Files Changed

| File | Change |
|------|--------|
| `components/landing/PromoHint.tsx` | Mobile-responsive modal positioning and layout |
| `components/landing/PromoBanner.tsx` | Same safe area fix for floating variant |
| `app/layout.tsx` | Added viewport export with `viewportFit: 'cover'` |

## Testing Checklist

- [ ] iPhone Safari - modal visible above home indicator
- [ ] iPhone Safari - text not truncated
- [ ] iPhone Safari - CTA button easily tappable (44px+ target)
- [ ] Android Chrome - modal positioned correctly
- [ ] Desktop - modal centered, max-width applied

## Key Learnings

1. **Always use `env(safe-area-inset-bottom)`** for bottom-positioned modals/banners on iOS
2. **Requires `viewport-fit: cover`** in the viewport meta tag
3. **Mobile-first responsive classes** - base styles for mobile, `sm:` for larger screens
4. **Touch targets** - minimum 44px for comfortable tapping
