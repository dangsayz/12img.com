import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getUserGalleries } from '@/server/queries/gallery.queries'
import { Header } from '@/components/layout/Header'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { Button } from '@/components/ui/button'
import { HeroSection } from '@/components/landing/HeroSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { GalleryShowcase } from '@/components/landing/GalleryShowcase'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { Footer } from '@/components/landing/Footer'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { userId } = await auth()

  // If logged in, show Dashboard
  if (userId) {
    const galleries = await getUserGalleries(userId)
    
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 pt-32 pb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-8">My Galleries</h1>

          {galleries.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-gray-200 bg-gray-50/50 shadow-soft">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-soft">
                <Plus className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">No galleries yet</h3>
              <p className="mt-2 text-gray-500 mb-8 max-w-sm text-center">
                Create your first gallery to get started. It only takes a few seconds.
              </p>
              <Link href="/gallery/create">
                <Button className="h-12 rounded-full px-8 shadow-lg hover:scale-105 transition-all">
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
      <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex h-14 w-full max-w-5xl items-center justify-between rounded-full border border-white/40 bg-white/80 pl-6 pr-2 shadow-soft backdrop-blur-xl transition-all hover:bg-white/90 hover:shadow-soft-xl">
          <Link href="/" className="text-lg font-bold tracking-tighter text-gray-900">12img</Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="h-10 rounded-full bg-gray-900 px-6 text-sm font-medium text-white shadow-lg hover:bg-gray-800 hover:scale-105 transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      
      <HeroSection />
      <HowItWorksSection />
      <GalleryShowcase />
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </main>
  )
}
