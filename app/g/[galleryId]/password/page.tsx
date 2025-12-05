import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-200 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md p-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#1C1917] flex items-center justify-center text-white font-bold text-sm">
              12
            </div>
            <span className="text-lg font-semibold text-[#1C1917]">img</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-soft-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-[#1C1917] mb-2">
              {gallery.title}
            </h1>
            <p className="text-sm text-[#78716C]">
              This gallery is password protected
            </p>
          </div>
          
          <PasswordGate galleryId={gallery.id} gallerySlug={galleryId} />
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#A8A29E]">
            Gallery hosted by{' '}
            <Link href="/" className="text-[#78716C] hover:text-[#1C1917] transition-colors">
              12img
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
