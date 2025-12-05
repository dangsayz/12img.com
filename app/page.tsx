import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getUserGalleries } from '@/server/queries/gallery.queries'
import { Header } from '@/components/layout/Header'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const galleries = await getUserGalleries(userId)

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">My Galleries</h1>
          <Link href="/gallery/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Gallery
            </Button>
          </Link>
        </div>

        {galleries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No galleries yet</p>
            <Link href="/gallery/create">
              <Button>Create your first gallery</Button>
            </Link>
          </div>
        ) : (
          <GalleryGrid galleries={galleries} />
        )}
      </main>
    </>
  )
}
