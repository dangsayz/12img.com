'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for trying things out.',
    features: ['3 galleries', '50 images per gallery', 'Standard quality', '7-day link expiry'],
    cta: 'Start free',
    href: '/sign-up',
    popular: false,
  },
  {
    name: 'Basic',
    price: '$10',
    period: '/month',
    description: 'For hobbyists and side projects.',
    features: ['10 galleries', '200 images per gallery', 'High quality', 'Password protection', '30-day link expiry'],
    cta: 'Get Basic',
    href: '/sign-up?plan=basic',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/month',
    description: 'For working photographers.',
    features: ['50 galleries', '500 images per gallery', 'Original quality', 'Custom branding', 'No link expiry'],
    cta: 'Get Pro',
    href: '/sign-up?plan=pro',
    popular: true,
  },
  {
    name: 'Studio',
    price: '$20',
    period: '/month',
    description: 'For high-volume professionals.',
    features: ['Unlimited galleries', 'Unlimited images', 'Original quality', 'Priority support', 'Team access (coming soon)'],
    cta: 'Get Studio',
    href: '/sign-up?plan=studio',
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section className="py-24 lg:py-32 bg-soft-bg relative overflow-hidden">
      {/* Background Blob */}
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-soft-lime/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-500 font-medium">
            No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`relative rounded-[28px] p-6 transition-all duration-300 flex flex-col ${
                plan.popular
                  ? 'bg-white shadow-neumorphic-lg border border-white/60 scale-[1.02] z-10'
                  : 'bg-white/60 shadow-neumorphic-sm border border-white/40 hover:bg-white hover:shadow-neumorphic-md hover:-translate-y-1'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-gray-900 px-4 py-1 text-xs font-bold text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-x-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {plan.name}
                </h3>
              </div>

              <div className="mt-4 flex items-baseline gap-x-1">
                <span className="text-3xl font-bold tracking-tight text-gray-900">{plan.price}</span>
                {plan.period && <span className="text-sm font-semibold leading-6 text-gray-500">{plan.period}</span>}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-gray-500 font-medium min-h-[40px]">
                {plan.description}
              </p>

              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className={`h-5 w-4 flex-none ${plan.popular ? 'text-gray-900' : 'text-gray-400'}`} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 block rounded-[16px] px-3 py-3 text-center text-sm font-bold transition-all ${
                  plan.popular
                    ? 'bg-gray-900 text-white shadow-lg hover:bg-gray-800 hover:scale-[1.02]'
                    : 'bg-soft-bg text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
