import { auth } from '@clerk/nextjs/server'
import { getUserGalleries } from '@/server/queries/gallery.queries'
import { getUserWithUsage } from '@/server/queries/user.queries'
import { Header } from '@/components/layout/Header'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { LandingPage } from '@/components/landing/LandingPage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const { userId } = await auth()

  // If logged in, show Dashboard
  if (userId) {
    const [galleries, userData] = await Promise.all([
      getUserGalleries(userId),
      getUserWithUsage(userId),
    ])
    
    return (
      <>
        <Header 
          userPlan={userData?.plan || 'free'}
          galleryCount={userData?.usage.galleryCount || 0}
          imageCount={userData?.usage.imageCount || 0}
          storageUsed={userData?.usage.totalBytes || 0}
          userRole={userData?.role}
        />
        <main className="container mx-auto px-4 pt-28 pb-12 max-w-6xl">
          <Dashboard galleries={galleries} />
        </main>
      </>
    )
  }

  // If not logged in, show minimal Landing Page
  return <LandingPage />
}
