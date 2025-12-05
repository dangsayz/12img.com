'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for hobbyists and portfolio building.',
    features: ['3 Galleries', '100 Images per gallery', 'Standard quality', 'Password protection'],
    cta: 'Start for free',
    href: '/sign-up',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    description: 'For professional photographers who need more.',
    features: ['Unlimited Galleries', 'Unlimited Images', 'Original quality', 'Priority support', 'Custom branding'],
    cta: 'Get Pro',
    href: '/sign-up?plan=pro',
    popular: true,
  },
]

export function PricingSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
        <div className="h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`relative rounded-3xl p-8 xl:p-10 transition-all ${
                plan.popular
                  ? 'bg-white/80 ring-1 ring-indigo-500/50 shadow-xl backdrop-blur-sm scale-105 z-10'
                  : 'bg-white ring-1 ring-gray-200 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-indigo-500 px-4 py-1 text-sm font-medium text-white shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-x-4">
                <h3 className={`text-lg font-semibold leading-8 ${plan.popular ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
              </div>

              <div className="mt-4 flex items-baseline gap-x-2">
                <span className="text-4xl font-bold tracking-tight text-gray-900">{plan.price}</span>
                {plan.period && <span className="text-sm font-semibold leading-6 text-gray-600">{plan.period}</span>}
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-600">
                {plan.description}
              </p>

              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className={`h-6 w-5 flex-none ${plan.popular ? 'text-indigo-600' : 'text-gray-400'}`} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 block rounded-full px-3 py-2.5 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all ${
                  plan.popular
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600'
                    : 'bg-gray-50 text-gray-900 ring-1 ring-inset ring-gray-200 hover:ring-gray-300 hover:bg-gray-100'
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
