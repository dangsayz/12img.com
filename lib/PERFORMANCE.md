# 12img Performance Architecture

> Last updated: December 2024

This document explains the performance optimizations used throughout 12img to handle large photo galleries (500-5000+ images) efficiently.

---

## 🖼️ Image Loading Strategy

### Three-Tier Image Sizes

| Size | Dimensions | Quality | Use Case |
|------|------------|---------|----------|
| **THUMBNAIL** | 600px width | 80% | Grid display, cards |
| **PREVIEW** | 1920px width | 85% | Fullscreen viewer |
| **ORIGINAL** | No transform | 100% | Downloads only |

**Key Principle**: Never serve full-resolution images for display. Users only get originals when downloading.

### Configuration
```typescript
// lib/utils/constants.ts
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 600, quality: 80 },
  PREVIEW: { width: 1920, quality: 85 },
  ORIGINAL: null, // No transform
}
```

---

## ⚡ Signed URL Generation

### The Problem
Generating signed URLs for 670 images sequentially takes 15-20 seconds.

### The Solution
Generate ALL URLs in parallel:

```typescript
// lib/storage/signed-urls.ts
// ❌ OLD: Sequential batches (slow)
for (let i = 0; i < paths.length; i += 20) {
  await Promise.all(batch.map(...))
}

// ✅ NEW: Full parallel (fast)
await Promise.all(paths.map(async (path) => {
  return supabaseAdmin.storage.createSignedUrl(path, ...)
}))
```

**Result**: 10-50x faster URL generation

---

## 🎨 Component Rendering

### The Problem
Using Framer Motion's `whileInView` on 670 images creates 670 intersection observers.

### The Solution
Use CSS transitions instead:

```tsx
// ❌ OLD: Per-item Framer Motion
<motion.div
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }}
>

// ✅ NEW: CSS transitions
<div className="transition-opacity duration-300">
  <Image onLoad={() => setIsLoaded(true)} />
</div>
```

**Result**: 0 intersection observers, pure CSS GPU-accelerated animations

---

## 🚀 Loading Priority

### Smart Priority Hints

```tsx
// First 4 images: Preload in <head>
priority={index < 4}

// First 8 images: Load immediately
loading={index < 8 ? 'eager' : 'lazy'}

// Rest: Native lazy loading
loading="lazy"
```

### Skeleton Placeholders

```tsx
{!isLoaded && (
  <div className="animate-pulse bg-gradient-to-br from-stone-100 to-stone-200" />
)}
```

**Result**: Zero layout shift (CLS = 0), instant perceived loading

---

## 📤 Upload Optimization

### Client-Side Compression

Before uploading, images are compressed on the client:

```typescript
// lib/upload/image-compressor.ts
- Max dimension: 4096px
- Quality: 85% JPEG
- Only compress if result is smaller
```

**Result**: 5-10x smaller uploads, 5-10x faster upload times

### Adaptive Concurrency

```typescript
// lib/upload/adaptive-concurrency.ts
- Starts at 6 concurrent uploads
- Increases on success, decreases on failure
- Range: 3-20 concurrent
```

---

## 📊 Performance Metrics

| Metric | Before | After |
|--------|--------|-------|
| URL Generation (670 images) | ~15-20s | ~1-2s |
| Intersection Observers | 670 | 0 |
| Initial Bundle Impact | Heavy | Minimal |
| LCP (Largest Contentful Paint) | Delayed | First 4 prioritized |
| CLS (Cumulative Layout Shift) | Variable | 0 (skeletons) |

---

## 🔮 Future Optimizations

Not yet implemented but worth considering:

1. **BlurHash/LQIP** - Low-quality image placeholders stored in DB
2. **Infinite Scroll** - Load images in chunks as user scrolls
3. **Service Worker** - Cache thumbnails for repeat visits
4. **Edge Caching** - Cache signed URLs at CDN edge
5. **Pre-generated Derivatives** - Background job on upload

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `lib/utils/constants.ts` | Image sizes, upload limits |
| `lib/storage/signed-urls.ts` | URL generation (parallel) |
| `lib/upload/image-compressor.ts` | Client compression |
| `lib/upload/adaptive-concurrency.ts` | Upload throttling |
| `components/gallery/PublicGalleryView.tsx` | Optimized gallery render |

---

## 🧪 Testing Performance

```bash
# Check bundle size
npm run build && npm run analyze

# Lighthouse audit
npx lighthouse https://www.12img.com/view-reel/your-gallery

# Core Web Vitals
# Use Chrome DevTools > Performance tab
```
