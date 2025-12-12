export { CleanGrid } from './CleanGrid'
export { MosaicLayout } from './MosaicLayout'
export { MosaicView } from './MosaicView'
export { CinematicLayout } from './CinematicLayout'
export { AlbumView } from './AlbumView'

export type GalleryTemplate = 'mosaic' | 'clean-grid' | 'cinematic' | 'editorial' | 'album'

// Default template is 'editorial' - magazine-style story layout
export const DEFAULT_TEMPLATE: GalleryTemplate = 'editorial'

export const GALLERY_TEMPLATES = [
  {
    id: 'mosaic' as const,
    name: 'Mosaic',
    description: 'Dynamic collage layout',
    preview: '/images/templates/mosaic.jpg',
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
    description: 'Magazine-style story layout (default)',
    preview: '/images/templates/editorial.jpg',
    isDefault: true,
  },
  {
    id: 'album' as const,
    name: 'Album',
    description: 'Photo book with page-turn navigation',
    preview: '/images/templates/album.jpg',
  },
]
