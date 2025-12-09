
export interface EditorialImage {
  id: string
  url: string
  width: number
  height: number
  aspectRatio: number
  role?: 'hero' | 'supporting' | 'detail' | 'texture'
  dominantColor?: string
  orientation: 'landscape' | 'portrait' | 'square'
  /** SEO proxy URL for downloads (same-origin, has Content-Disposition header) */
  proxyUrl?: string
  /** SEO-friendly filename for downloads */
  seoFilename?: string
}

export type SpreadTemplate = 
  | 'hero-intro'        // Full bleed image left, text right
  | 'cinematic-full'    // Full width image
  | 'editorial-split'   // Classic magazine 2-col split
  | 'trio-balance'      // 3 vertical images
  | 'quote-focus'       // Large quote with ambient image
  | 'detail-grid'       // 4-6 small detail shots
  | 'portrait-focus'    // Large portrait with text wrap
  | 'asymmetric-left'   // Heavy left, light right
  | 'asymmetric-right'  // Heavy right, light left
  | 'quad-grid'         // 2x2 grid of details
  | 'staggered-cascade' // Clean asymmetric stepped layout

export interface GridSpan {
  colStart: number
  colSpan: number
  rowStart?: number
  rowSpan?: number
}

export interface LayoutElement {
  id: string
  type: 'image' | 'text' | 'quote' | 'divider' | 'space' | 'letter'
  content: any // Image object or text string
  span: GridSpan
  style?: {
    align?: 'start' | 'center' | 'end'
    fit?: 'cover' | 'contain'
    className?: string
    fontSize?: 'sm' | 'md' | 'lg' | 'xl' | 'display'
    fontFamily?: 'serif' | 'sans'
  }
}

export interface EditorialSpread {
  id: string
  template: SpreadTemplate
  elements: LayoutElement[]
  height: 'viewport' | 'auto' | number
  pageNumber?: number
  theme?: 'light' | 'dark' | 'accent' // New: For colored backgrounds
}

export interface LayoutConfig {
  columns: 12
  gutter: number // px
  margin: number // px
  baseline: number // px
}
