import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Lock, 
  Globe, 
  Shield, 
  Calendar, 
  HardDrive, 
  Image as ImageIcon,
  User,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'
import { getAdminGalleryDetails } from '@/server/admin/galleries'

interface Props {
  params: Promise<{ galleryId: string }>
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminGalleryViewPage({ params }: Props) {
  const { galleryId } = await params
  
  let gallery: Awaited<ReturnType<typeof getAdminGalleryDetails>> | null = null
  let error: string | null = null
  
  try {
    gallery = await getAdminGalleryDetails(galleryId)
  } catch (err) {
    console.error('Admin gallery view error:', err)
    error = err instanceof Error ? err.message : 'Unknown error'
  }
  
  if (error || !gallery) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Gallery View</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Gallery</h2>
          <p className="text-sm text-red-600">{error || 'Gallery not found'}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/users/${gallery.userId}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-2xl lg:text-3xl text-[#141414]">{gallery.title}</h1>
          <p className="text-sm text-[#525252] mt-1">/{gallery.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {gallery.isPublic ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Globe className="w-3 h-3" />
              Public
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">
              <Lock className="w-3 h-3" />
              Private
            </span>
          )}
          {gallery.isLocked && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <Shield className="w-3 h-3" />
              Password Protected
            </span>
          )}
        </div>
      </div>
      
      {/* Audit Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Admin Access Logged</p>
          <p className="text-xs text-amber-600 mt-0.5">
            This view has been recorded in the audit log for compliance. Only access user content when necessary for support or trust & safety purposes.
          </p>
        </div>
      </div>
      
      {/* Gallery Info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E5E5] p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#525252]">Owner</p>
              <Link 
                href={`/admin/users/${gallery.userId}`}
                className="text-sm font-medium text-[#141414] hover:underline truncate block"
              >
                {gallery.userEmail}
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-[#E5E5E5] p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ImageIcon className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-[#525252]">Images</p>
              <p className="text-sm font-medium text-[#141414]">{gallery.imageCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-[#E5E5E5] p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <HardDrive className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-[#525252]">Storage</p>
              <p className="text-sm font-medium text-[#141414]">{formatBytes(gallery.totalBytes)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-[#E5E5E5] p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-[#525252]">Created</p>
              <p className="text-sm font-medium text-[#141414]">{formatDate(gallery.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Public Link */}
      {gallery.isPublic && (
        <div className="bg-white border border-[#E5E5E5] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#141414]">Public Gallery Link</p>
              <p className="text-xs text-[#525252] mt-0.5">View as a visitor would see it</p>
            </div>
            <a
              href={`/view-reel/${gallery.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#141414] bg-[#F5F5F5] hover:bg-[#E5E5E5] rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Public View
            </a>
          </div>
        </div>
      )}
      
      {/* Images Grid */}
      <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5E5]">
          <h2 className="font-medium text-[#141414]">Gallery Images</h2>
          <p className="text-xs text-[#525252] mt-0.5">
            Thumbnails shown below. Click to view larger (access logged).
          </p>
        </div>
        
        {gallery.images.length === 0 ? (
          <div className="p-12 text-center">
            <ImageIcon className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" />
            <p className="text-sm text-[#525252]">No images in this gallery</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {gallery.images.map((image, index) => (
                <div
                  key={image.id}
                  className="group relative aspect-square bg-[#F5F5F5] rounded-lg overflow-hidden"
                >
                  {image.thumbnailUrl ? (
                    <img
                      src={image.thumbnailUrl}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-[#D4D4D4]" />
                    </div>
                  )}
                  
                  {/* Overlay with info */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                    <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-full p-2 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-[10px] text-white/90 truncate">
                          {image.originalFilename}
                        </p>
                        <p className="text-[9px] text-white/70">
                          {formatBytes(image.fileSizeBytes)}
                          {image.width && image.height && ` · ${image.width}×${image.height}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Position badge */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 rounded text-[9px] text-white font-medium">
                    {image.position + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Description */}
      {gallery.description && (
        <div className="bg-white border border-[#E5E5E5] p-6 rounded-lg">
          <h3 className="text-sm font-medium text-[#141414] mb-2">Description</h3>
          <p className="text-sm text-[#525252] whitespace-pre-wrap">{gallery.description}</p>
        </div>
      )}
    </div>
  )
}
