import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { PLANS } from '@/lib/config/pricing'
import { PricingCard } from '@/components/pricing/PricingCard'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple storage-only pricing for photographers. Start free with 2GB, upgrade as you grow. Plans from $0 to $30/month.',
  openGraph: {
    title: 'Pricing — 12img Photo Gallery Platform',
    description: 'Simple storage-only pricing for photographers. Start free, upgrade as you grow.',
  },
}

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FAF8F3]">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
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
