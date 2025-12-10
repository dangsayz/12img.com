import { Suspense } from 'react'
import { searchGalleriesAdvanced, getGalleryStats, getConversionCandidates } from '@/server/admin/galleries'
import { GalleriesContent } from './GalleriesContent'

interface Props {
  searchParams: Promise<{
    search?: string
    page?: string
    visibility?: string
    plan?: string
    sort?: string
    order?: string
    minImages?: string
    maxImages?: string
  }>
}

export default async function AdminGalleriesPage({ searchParams }: Props) {
  const params = await searchParams
  
  const page = parseInt(params.page || '1', 10)
  const filters = {
    search: params.search,
    visibility: (params.visibility as 'all' | 'public' | 'private') || 'all',
    plan: params.plan,
    sortBy: (params.sort as any) || 'created_at',
    sortOrder: (params.order as 'asc' | 'desc') || 'desc',
    minImages: params.minImages ? parseInt(params.minImages, 10) : undefined,
    maxImages: params.maxImages ? parseInt(params.maxImages, 10) : undefined,
  }
  
  const [galleriesResult, stats, conversionCandidates] = await Promise.all([
    searchGalleriesAdvanced(filters, page, 50),
    getGalleryStats(),
    getConversionCandidates(10),
  ])
  
  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 className="font-serif text-2xl lg:text-4xl text-[#141414]">Galleries</h1>
        <p className="text-[#525252] text-sm lg:text-base mt-1 lg:mt-2">
          Browse, search, and manage all galleries across the platform
        </p>
      </div>
      
      <Suspense fallback={<div className="animate-pulse bg-stone-100 h-96" />}>
        <GalleriesContent 
          galleries={galleriesResult}
          stats={stats}
          conversionCandidates={conversionCandidates}
          currentFilters={filters}
          currentPage={page}
        />
      </Suspense>
    </div>
  )
}
