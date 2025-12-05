import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { PLANS } from '@/lib/config/pricing'
import { PricingCard } from '@/components/pricing/PricingCard'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for photographers. Start free, upgrade as you grow. Plans from $0 to $29/month with unlimited galleries and storage.',
  openGraph: {
    title: 'Pricing — 12img Photo Gallery Platform',
    description: 'Simple, transparent pricing for photographers. Start free, upgrade as you grow.',
  },
}

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FAF8F3]">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#1C1917] mb-4">Simple, transparent pricing</h1>
            <p className="text-lg text-[#78716C]">
              Choose the plan that works best for your photography business
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, index) => (
              <PricingCard
                key={plan.id}
                name={plan.name}
                description={plan.description}
                price={plan.monthlyPrice}
                features={plan.features}
                cta={plan.cta}
                href={`/sign-up?plan=${plan.id}`}
                popular={plan.popular}
                delay={index * 0.1}
              />
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-[#78716C]">
              Need a custom plan?{' '}
              <Link href="/contact" className="text-amber-600 hover:underline">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
