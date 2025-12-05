import { notFound, redirect } from 'next/navigation'
import { getGalleryBySlug } from '@/server/queries/gallery.queries'
import { PasswordGate } from '@/components/gallery/PasswordGate'

interface Props {
  params: { galleryId: string }
}

export default async function PasswordPage({ params }: Props) {
  const gallery = await getGalleryBySlug(params.galleryId)

  if (!gallery) {
    notFound()
  }

  if (!gallery.password_hash) {
    redirect(`/g/${params.galleryId}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold text-center mb-2">
          {gallery.title}
        </h1>
        <p className="text-gray-500 text-center mb-6">
          This gallery is password protected.
        </p>
        <PasswordGate galleryId={gallery.id} gallerySlug={params.galleryId} />
      </div>
    </div>
  )
}
