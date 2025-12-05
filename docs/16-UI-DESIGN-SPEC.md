# 12img UI Design & Implementation Specification

## 1. Page & Layout Spec

### Overall Design Philosophy
**"Apple landing page for a gallery-only product."**
*   **Vibe:** Minimal, cinematic, soft, premium, editorial.
*   **Lighting:** Soft orb/fluid gradients (aurora borealis but subtle).
*   **Materials:** Glassmorphism (frosted blur), Neumorphism (soft shadows), Matte surfaces.
*   **Interactions:** "Animate on view" (scroll reveals), Border beams, Micro-interactions.

### Global Grid & Typography
*   **Container:** `max-w-7xl` (1280px) for desktop, `max-w-5xl` (1024px) for tablets.
*   **Padding:** `px-4` mobile, `px-6` tablet, `px-8` desktop.
*   **Vertical Rhythm:**
    *   Sections: `py-20` or `py-24` (desktop), `py-16` (mobile).
    *   Element Gaps: `gap-4` (tight), `gap-8` (standard), `gap-12` (loose).
*   **Typography (Inter/Geist Sans):**
    *   **H1 (Hero):** `text-5xl md:text-7xl font-semibold tracking-tight` (Tight leading).
    *   **H2 (Section):** `text-3xl md:text-4xl font-medium tracking-tight`.
    *   **H3 (Card):** `text-xl font-medium`.
    *   **Body:** `text-base md:text-lg text-muted-foreground leading-relaxed`.
    *   **Small/Label:** `text-sm font-medium tracking-wide uppercase text-muted-foreground`.

### Color System
*   **Base Surface:**
    *   Light: `#FFFFFF` (Main bg), `#F9FAFB` (Secondary bg/blobs).
    *   Dark: `#0A0A0A` (Footer/Hero accent), `#171717` (Cards).
*   **Accent Gradient (The "Orb"):**
    *   Soft Violet to Blue: `from-indigo-500/20 via-purple-500/20 to-blue-500/20`.
    *   Warm Glow (Alternative): `from-orange-500/10 via-rose-500/10 to-amber-500/10`.
*   **Glass:** `bg-white/10` or `bg-black/5` with `backdrop-blur-xl`.
*   **Borders:** `border-white/10` (dark mode glass) or `border-black/5` (light mode subtle).

---

## 2. Component & Section Breakdown (Landing Page)

### HeroSection
*   **Layout:** Two-column grid (Text Left, Visual Right) on desktop. Stacked on mobile.
*   **Left (Copy):**
    *   Label: "For Photographers" (Pill shape, glass bg).
    *   Headline: "Share your work, beautifully."
    *   Subcopy: "Ultra-minimal client galleries. No clutter. Just your images."
    *   CTA: **Border Beam Button** (Dark bg, 1px moving gradient border).
*   **Right (Visual - The "Orb"):**
    *   **Layer 1 (Back):** Large, blurred gradient orb (`w-[500px] h-[500px] rounded-full blur-3xl opacity-30 animate-pulse-slow`).
    *   **Layer 2 (Front):** Glass card tilting in 3D (Perspective). Inside the card: A mini grid of images (fake gallery).
*   **Animation:** Staggered fade-up for text. Orb floats gently.

### HowItWorksSection (The "Process")
*   **Layout:** Horizontal strip of 3 steps.
*   **Visual:** "Neumorphic" cards. White surface, very soft shadow (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]`).
*   **Steps:**
    1.  **Upload:** Icon of cloud + images.
    2.  **Link:** Icon of a chain/link.
    3.  **View:** Icon of an eye/gallery.
*   **Interaction:** Cards lift slightly (`-translate-y-1`) on hover.

### FeatureShowcase (Timeline Layout)
*   **Layout:** Grid with "Sticky Left" typography and "Scrolling Right" content.
*   **Left:** "Key Features" headline.
*   **Right:** Stack of feature blocks.
    *   *Block 1 (Speed):* "Uploads at the speed of light."
    *   *Block 2 (Privacy):* "Password protected by default."
    *   *Block 3 (Download):* "One-click zip downloads."
*   **Style:** Clean editorial typography. Minimal icons.

### PricingSection
*   **Layout:** 2 cards centered (Free vs Pro).
*   **Style:**
    *   *Free:* Simple border, white bg.
    *   *Pro:* Glassmorphism over a subtle gradient blob. "Popular" pill badge.
*   **Content:** Price, list of checks, CTA.

### Footer
*   **Style:** Minimal.
*   **Content:** Logo (left), Copyright (right), Links (center - minimal).
*   **Bg:** Transparent or very subtle gray.

---

## 3. App Shell & Core Screens

### AppShellLayout (`/app`)
*   **Top Nav:**
    *   **Left:** Logo (Text/Icon).
    *   **Right:** User Avatar (Clerk), "Create" Button (Mobile only: Icon).
    *   **Glass:** Sticky, `backdrop-blur-md border-b border-black/5`.
*   **Mobile Nav:** Bottom bar. 3 segments: Galleries, Upload, Settings. Soft gradient active state.

### MyGalleriesPage (`/app/galleries`)
*   **Empty State:**
    *   Center aligned.
    *   Icon: Large, stroke-width-1, soft gray.
    *   Text: "No galleries yet. Start your first project."
    *   Button: Primary Create Button.
*   **Grid View:**
    *   Cards: Aspect ratio `4:3` cover image.
    *   Info: Title (truncate), Date (small), Status (Public/Locked).
    *   **Hover:** Cover image zooms slightly (`scale-105`). "View" button appears in center.
    *   **Actions:** Context menu (`...`) in top-right corner of card.

### CreateGalleryFlow (Modal)
*   **Format:** **Dialog/Modal** (Centered). Better for focus than side sheet on desktop.
*   **Steps:**
    1.  **Name:** Large input, auto-focus. "Wedding 2024".
    2.  **Settings:** Toggles for "Password" and "Downloads".
    3.  **Submit:** "Create Gallery" -> Redirects to Upload.
*   **Upload UI:**
    *   Dropzone area with dashed border (animated on drag over).
    *   Progress bars: Thin lines under filenames. Green checkmark on complete.

### GalleryPreview (Photographer View)
*   **Header:** Title, Link (Copy), Settings (Icon).
*   **Grid:** Masonry layout.
*   **Controls:** Floating action bar at bottom (or top right) to "Add More" or "Share".

### PublicGalleryView (Client View)
*   **Hero:** Full screen cover image (optional) or huge Title + Date.
*   **Grid:** Full-bleed masonry. Minimal gaps (`gap-1` or `gap-2`).
*   **Lightbox:** Full screen, black background, immersive.
*   **Download:** If enabled, a floating "Download" pill button in bottom right (glass).

---

## 4. Tailwind + Motion Implementation Notes

### Design Tokens (Tailwind Config Extension)
```ts
// tailwind.config.ts additions
theme: {
  extend: {
    colors: {
      glass: "rgba(255, 255, 255, 0.1)",
      "glass-border": "rgba(255, 255, 255, 0.2)",
    },
    boxShadow: {
      'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
      'glow': '0 0 20px rgba(124, 58, 237, 0.3)', // Violet glow
    },
    animation: {
      'border-beam': 'border-beam 4s linear infinite',
      'float': 'float 6s ease-in-out infinite',
    },
    keyframes: {
      'border-beam': {
        '100%': { offsetDistance: '100%' },
      },
      'float': {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
      }
    }
  }
}
```

### Framer Motion Variants

**Reveal on Scroll (The "Apple" fade up):**
```ts
const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] } // Ease out cubic
  }
}
```

**Stagger Container:**
```ts
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}
```

**Button Hover (Scale + Glow):**
```ts
const buttonHover = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    boxShadow: "0 0 20px rgba(124, 58, 237, 0.3)",
    transition: { duration: 0.2 }
  }
}
```

### Component Utilities (Class Patterns)
*   **Glass Panel:** `bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm`
*   **Gradient Text:** `bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500`
*   **Orb Blob:** `absolute -z-10 w-[30rem] h-[30rem] bg-purple-400/30 rounded-full blur-3xl`

### Border Beam Button Implementation
Use a pseudo-element or a child SVG that animates along the `clip-path` or `offset-path` of the border. Alternatively, use the `conic-gradient` mask trick:
*   Wrapper: `relative overflow-hidden rounded-full p-[1px]` (The border width)
*   Beam: `absolute inset-[-100%] animate-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]`
*   Content: `relative h-full w-full rounded-full bg-slate-950 px-3 py-1` (The button inner)

---
