import { notFound, redirect } from 'next/navigation'
import { getGalleryBySlug } from '@/server/queries/gallery.queries'
import { PasswordGate } from '@/components/gallery/PasswordGate'

interface Props {
  params: Promise<{ galleryId: string }>
}

export default async function PasswordPage({ params }: Props) {
  const { galleryId } = await params
  const gallery = await getGalleryBySlug(galleryId)

  if (!gallery) {
    notFound()
  }

  if (!gallery.password_hash) {
    redirect(`/g/${galleryId}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 relative overflow-hidden">
      {/* Background Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
        <div className="h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-3xl opacity-50 animate-pulse-slow" />
      </div>

      <div className="w-full max-w-md p-8">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
              {gallery.title}
            </h1>
            <p className="text-sm text-gray-500">
              This gallery is password protected.
            </p>
          </div>
          
          <PasswordGate galleryId={gallery.id} gallerySlug={galleryId} />
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by 12img
          </p>
        </div>
      </div>
    </div>
  )
}
