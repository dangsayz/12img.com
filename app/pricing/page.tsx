import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { Header } from '@/components/layout/Header'
import { PLANS } from '@/lib/config/pricing'
import { PricingCard } from '@/components/pricing/PricingCard'
import { getUserWithUsage } from '@/server/queries/user.queries'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple storage-only pricing for photographers. Start free with 2GB, upgrade as you grow. Plans from $0 to $30/month.',
  openGraph: {
    title: 'Pricing — 12img Photo Gallery Platform',
    description: 'Simple storage-only pricing for photographers. Start free, upgrade as you grow.',
  },
}

export default async function PricingPage() {
  const { userId } = await auth()
  const userData = userId ? await getUserWithUsage(userId) : null
  
  return (
    <>
      <Header 
        userPlan={userData?.plan || 'free'}
        galleryCount={userData?.usage.galleryCount || 0}
        imageCount={userData?.usage.imageCount || 0}
        storageUsed={userData?.usage.totalBytes || 0}
        isAuthenticated={!!userId}
      />
      <main className="min-h-screen bg-[#FAF8F3]">
        <div className="container mx-auto px-4 pt-28 pb-16 max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#1C1917] mb-4">Simple, honest pricing</h1>
            <p className="text-lg text-[#78716C]">
              Just storage and images. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PLANS.map((plan, index) => (
              <PricingCard
                key={plan.id}
                planId={plan.id}
                name={plan.name}
                description={plan.description}
                price={plan.monthlyPrice}
                features={plan.features}
                cta={plan.cta}
                popular={plan.popular}
                delay={index * 0.05}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-[#78716C]">
              All plans include password protection, download options, and mobile-optimized galleries.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
