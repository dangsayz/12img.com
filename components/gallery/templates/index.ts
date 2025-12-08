export { CleanGrid } from './CleanGrid'
export { MosaicLayout } from './MosaicLayout'
export { CinematicLayout } from './CinematicLayout'

export type GalleryTemplate = 'mosaic' | 'clean-grid' | 'cinematic' | 'editorial'

// Default template is 'mosaic' - the Pic-Time style collage layout
export const DEFAULT_TEMPLATE: GalleryTemplate = 'mosaic'

export const GALLERY_TEMPLATES = [
  {
    id: 'mosaic' as const,
    name: 'Mosaic',
    description: 'Dynamic collage layout (default)',
    preview: '/images/templates/mosaic.jpg',
    isDefault: true,
  },
  {
    id: 'clean-grid' as const,
    name: 'Clean Grid',
    description: 'Minimal, uniform grid on white',
    preview: '/images/templates/clean-grid.jpg',
  },
  {
    id: 'cinematic' as const,
    name: 'Cinematic',
    description: 'Dark, moody, framed spreads',
    preview: '/images/templates/cinematic.jpg',
  },
  {
    id: 'editorial' as const,
    name: 'Editorial',
    description: 'Magazine-style story layout',
    preview: '/images/templates/editorial.jpg',
  },
]
