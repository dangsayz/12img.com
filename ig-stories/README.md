# 12img Instagram Story Mockups

High-conversion CTA screens for Instagram Stories (1080×1920 px, 9:16 aspect ratio).

## Quick Start

1. Open `index.html` in your browser
2. Click any story preview to open full-size
3. Use browser's screenshot or print-to-PDF to export

## Stories Included

| Story | Purpose | CTA | Psychological Trigger |
|-------|---------|-----|----------------------|
| **story-1-hero.html** | Primary hero | "Create Your Gallery in Seconds" | Speed & efficiency |
| **story-2-features.html** | Feature showcase | "Upload • Deliver • Get Paid" | Workflow differentiation |
| **story-3-social-proof.html** | Trust building | "Trusted by Photographers Worldwide" | Social proof + authority |
| **story-4-urgency.html** | Conversion push | "Try It Free — Limited Beta Access" | Scarcity (12 spots left) |
| **story-5-testimonial.html** | Testimonial-first | "Deliver images instantly" | Speed + social proof |

## Exporting as PNG

### Option 1: Browser Screenshot (Recommended)
1. Open any story file in Chrome
2. Press `Cmd+Opt+I` (Mac) or `Ctrl+Shift+I` (Windows) for DevTools
3. Click device toolbar icon or press `Cmd+Shift+M`
4. Set dimensions to `1080 x 1920`
5. Right-click page → "Capture screenshot"

### Option 2: Using Puppeteer
```bash
npx puppeteer screenshot story-1-hero.html --viewport=1080,1920
```

## Design Specifications

- **Grid**: 8-point modular system
- **Border Radius**: 18-22px (thumb-optimized)
- **Touch Targets**: Min 48×48px
- **Contrast Ratio**: ≥4.5:1 (ADA compliant)
- **Typography**: Inter (3-tier scale)
- **Colors**: Deep neutrals + orange accent (#fb923c)

## Customization

Edit the HTML/CSS directly. Key color variables:
- Primary accent: `#fb923c` (orange)
- Urgency: `#ef4444` (red)
- Success: `#22c55e` (green)
- Background: `#0c0c0c` (near-black)

## Adding Platform Screenshots

Replace the placeholder elements with actual screenshots:
```html
<div class="ui-preview">
  <img src="your-screenshot.png" alt="Platform preview" />
</div>
```
