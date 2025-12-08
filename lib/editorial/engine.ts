
import { EditorialImage, EditorialSpread, LayoutElement, SpreadTemplate, GridSpan } from './types'

// Mock poetry and quotes for injection
const QUOTES = [
  "Love is composed of a single soul inhabiting two bodies.",
  "In all the world, there is no heart for me like yours.",
  "To love and be loved is to feel the sun from both sides.",
  "The best thing to hold onto in life is each other.",
  "Where there is love there is life.",
  "Two souls with but a single thought, two hearts that beat as one."
]

const POETRY_FRAGMENTS = [
  "The light touches\neverything softly",
  "In the quiet moments\nwe find truth",
  "Time stands still\nwhen hearts connect",
  "A promise written\nin light and shadow"
]

export class LayoutEngine {
  private config = {
    columns: 12,
    gutter: 20,
    margin: 40
  }

  constructor(config?: Partial<typeof LayoutEngine.prototype.config>) {
    if (config) this.config = { ...this.config, ...config }
  }

  /**
   * Main entry point: transform raw images into a magazine layout
   */
  public createLayout(images: any[], title: string = "Gallery"): EditorialSpread[] {
    const enrichedImages = this.analyzeImages(images)
    const spreads = this.distributeSpreads(enrichedImages)
    return this.injectTypography(spreads, title)
  }

  /**
   * Step 1: Analyze images to assign roles and detect orientation
   */
  private analyzeImages(rawImages: any[]): EditorialImage[] {
    return rawImages.map((img, index) => {
      const width = img.width || 1920
      const height = img.height || 1080
      const ratio = width / height
      
      let orientation: 'landscape' | 'portrait' | 'square' = 'square'
      if (ratio > 1.2) orientation = 'landscape'
      if (ratio < 0.85) orientation = 'portrait'

      // Heuristic for role assignment
      let role: EditorialImage['role'] = 'supporting'
      
      // First image is always hero
      if (index === 0) role = 'hero'
      // High res landscapes are candidates for hero
      else if (orientation === 'landscape' && width > 3000) role = 'hero'
      // Very wide images are panoramic
      else if (ratio > 1.8) role = 'hero'
      // Detail shots (often square or macro - hard to detect without ML, using random for demo)
      else if (index % 7 === 0) role = 'detail'

      return {
        id: img.id,
        url: img.previewUrl || img.url,
        width,
        height,
        aspectRatio: ratio,
        role,
        orientation,
        dominantColor: '#ffffff' // Placeholder
      }
    })
  }

  /**
   * Step 2: Distribute images into spread templates
   */
  private distributeSpreads(images: EditorialImage[]): EditorialSpread[] {
    const spreads: EditorialSpread[] = []
    let cursor = 0
    let pageNum = 1

    while (cursor < images.length) {
      const remaining = images.length - cursor
      const current = images[cursor]
      const next = images[cursor + 1]
      const next2 = images[cursor + 2]

      const next3 = images[cursor + 3]
      const next4 = images[cursor + 4]

      let template: SpreadTemplate = 'editorial-split'
      let consumed = 1
      let spreadElements: LayoutElement[] = []

      // 0. Layered Collage (5 images - Complex)
      // If we have 5 images and a mix of orientations
      if (remaining >= 5 && pageNum % 4 === 0) { // Occasional complex spread
        template = 'layered-collage'
        consumed = 5
        spreadElements = [
          // Large anchor left
          {
            id: `img-${current.id}`,
            type: 'image',
            content: current,
            span: { colStart: 2, colSpan: 5, rowStart: 1, rowSpan: 2 },
            style: { fit: 'cover' }
          },
          // Top right grid
          {
            id: `img-${next.id}`,
            type: 'image',
            content: next,
            span: { colStart: 8, colSpan: 2, rowStart: 1, rowSpan: 1 }
          },
          {
            id: `img-${next2.id}`,
            type: 'image',
            content: next2,
            span: { colStart: 10, colSpan: 2, rowStart: 1, rowSpan: 1 }
          },
          // Bottom right overlapping or grid
          {
            id: `img-${next3.id}`,
            type: 'image',
            content: next3,
            span: { colStart: 8, colSpan: 4, rowStart: 2, rowSpan: 1 }
          },
          // Offset accent
          {
             id: `img-${next4.id}`,
             type: 'image',
             content: next4,
             span: { colStart: 6, colSpan: 3, rowStart: 1, rowSpan: 1 }, // Overlap center
             style: { className: 'z-10 shadow-xl border-4 border-white' }
          }
        ]
      }
      // 1. Quad Grid (4 images)
      // Good for details or uniform aspect ratios
      else if (remaining >= 4 && 
          (current.orientation === next.orientation) && // First two match
          (next2.orientation === next3.orientation)) {  // Next two match
        template = 'quad-grid'
        consumed = 4
        spreadElements = [
          {
            id: `img-${current.id}`,
            type: 'image',
            content: current,
            span: { colStart: 3, colSpan: 4, rowStart: 1, rowSpan: 1 }
          },
          {
            id: `img-${next.id}`,
            type: 'image',
            content: next,
            span: { colStart: 7, colSpan: 4, rowStart: 1, rowSpan: 1 }
          },
          {
            id: `img-${next2.id}`,
            type: 'image',
            content: next2,
            span: { colStart: 3, colSpan: 4, rowStart: 2, rowSpan: 1 }
          },
          {
            id: `img-${next3.id}`,
            type: 'image',
            content: next3,
            span: { colStart: 7, colSpan: 4, rowStart: 2, rowSpan: 1 }
          }
        ]
      }
      // 2. Hero / Cinematic Spread (Landscape)
      else if (current.role === 'hero' && current.orientation === 'landscape') {
        template = 'cinematic-full'
        consumed = 1
        spreadElements = [{
          id: `img-${current.id}`,
          type: 'image',
          content: current,
          span: { colStart: 1, colSpan: 12, rowStart: 1, rowSpan: 1 },
          style: { fit: 'cover' }
        }]
      }
      // 2. Hero Intro (Portrait Hero + Text space)
      else if (current.role === 'hero' && current.orientation === 'portrait') {
        template = 'hero-intro'
        consumed = 1
        spreadElements = [
          {
            id: `img-${current.id}`,
            type: 'image',
            content: current,
            span: { colStart: 2, colSpan: 5, rowStart: 1, rowSpan: 1 }
          },
          {
            id: `txt-${current.id}`,
            type: 'text',
            content: { title: "The Beginning", body: "Capturing the essence of the moment." },
            span: { colStart: 8, colSpan: 4, rowStart: 1, rowSpan: 1 },
            style: { align: 'center', fontFamily: 'serif' }
          }
        ]
      }
      // 3. Trio Balance (3 Portraits or Squares)
      else if (remaining >= 3 && 
               current.orientation === 'portrait' && 
               next?.orientation === 'portrait' && 
               next2?.orientation === 'portrait') {
        template = 'trio-balance'
        consumed = 3
        spreadElements = [
          {
            id: `img-${current.id}`,
            type: 'image',
            content: current,
            span: { colStart: 1, colSpan: 4 }
          },
          {
            id: `img-${next.id}`,
            type: 'image',
            content: next,
            span: { colStart: 5, colSpan: 4 }
          },
          {
            id: `img-${next2.id}`,
            type: 'image',
            content: next2,
            span: { colStart: 9, colSpan: 4 }
          }
        ]
      }
      // 4. Asymmetric Left (1 Large, 2 Small)
      else if (remaining >= 3 && current.orientation === 'portrait') {
        template = 'asymmetric-left'
        consumed = 3
        spreadElements = [
          {
            id: `img-${current.id}`,
            type: 'image',
            content: current,
            span: { colStart: 2, colSpan: 6, rowStart: 1, rowSpan: 2 }
          },
          {
            id: `img-${next.id}`,
            type: 'image',
            content: next,
            span: { colStart: 9, colSpan: 3, rowStart: 1, rowSpan: 1 }
          },
          {
            id: `img-${next2.id}`,
            type: 'image',
            content: next2,
            span: { colStart: 9, colSpan: 3, rowStart: 2, rowSpan: 1 }
          }
        ]
      }
      // 5. Default: Split (2 images)
      else if (remaining >= 2) {
        template = 'editorial-split'
        consumed = 2
        spreadElements = [
          {
            id: `img-${current.id}`,
            type: 'image',
            content: current,
            span: { colStart: 2, colSpan: 5 }
          },
          {
            id: `img-${next.id}`,
            type: 'image',
            content: next,
            span: { colStart: 7, colSpan: 5 }
          }
        ]
      }
      // 6. Fallback: Single Centered
      else {
        template = 'hero-intro' // Reuse template for single image
        consumed = 1
        spreadElements = [{
          id: `img-${current.id}`,
          type: 'image',
          content: current,
          span: { colStart: 4, colSpan: 6 }
        }]
      }

      spreads.push({
        id: `spread-${pageNum}`,
        template,
        elements: spreadElements,
        height: template === 'cinematic-full' ? 'viewport' : 'auto',
        pageNumber: pageNum,
        theme: pageNum % 5 === 0 ? 'dark' : (pageNum % 7 === 0 ? 'accent' : 'light')
      })

      cursor += consumed
      pageNum++
    }

    return spreads
  }

  /**
   * Step 3: Inject Typography (Title only - quotes disabled for cleaner experience)
   */
  private injectTypography(spreads: EditorialSpread[], title: string): EditorialSpread[] {
    const injected = [...spreads]
    
    // Inject Title Spread at the beginning
    const titleSpread: EditorialSpread = {
      id: 'spread-title',
      template: 'hero-intro',
      height: 'viewport',
      pageNumber: 0,
      elements: [
        {
          id: 'title-main',
          type: 'text',
          content: { 
            title: title, 
            subtitle: "A Visual Story",
            isTitle: true 
          },
          span: { colStart: 2, colSpan: 10 },
          style: { align: 'center' }
        }
      ]
    }
    
    injected.unshift(titleSpread)

    // Note: Quote injection disabled for cleaner gallery experience
    // Photographers can add custom quotes in future via gallery settings

    return injected
  }
}
