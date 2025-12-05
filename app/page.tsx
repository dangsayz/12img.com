import { auth } from '@clerk/nextjs'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getUserGalleries } from '@/server/queries/gallery.queries'
import { Header } from '@/components/layout/Header'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { Button } from '@/components/ui/button'
import { HeroSection } from '@/components/landing/HeroSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { Footer } from '@/components/landing/Footer'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { userId } = auth()

  // If logged in, show Dashboard
  if (userId) {
    const galleries = await getUserGalleries(userId)
    
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">My Galleries</h1>
            <Link href="/gallery/create">
              <Button className="rounded-full px-6 shadow-sm hover:shadow-md transition-all">
                <Plus className="w-4 h-4 mr-2" />
                New Gallery
              </Button>
            </Link>
          </div>

          {galleries.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No galleries yet</h3>
              <p className="mt-1 text-sm text-gray-500 mb-6">Create your first gallery to get started.</p>
              <Link href="/gallery/create">
                <Button variant="outline" className="rounded-full">
                  Create Gallery
                </Button>
              </Link>
            </div>
          ) : (
            <GalleryGrid galleries={galleries} />
          )}
        </main>
      </>
    )
  }

  // If not logged in, show Landing Page
  return (
    <main className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tighter">12img</Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="rounded-full">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>
      
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </main>
  )
}
