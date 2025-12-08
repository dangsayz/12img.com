'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { PLANS } from '@/lib/config/pricing'

// Transform PLANS to the format expected by the component
const plans = PLANS.map(plan => ({
  name: plan.name,
  price: plan.monthlyPrice === 0 ? '$0' : `$${plan.monthlyPrice}`,
  period: plan.monthlyPrice === 0 ? undefined : '/month',
  description: plan.description,
  features: plan.features,
  cta: plan.cta,
  href: `/sign-up?plan=${plan.id}`,
  popular: plan.popular || false,
}))

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-soft-bg relative overflow-hidden scroll-mt-20">
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
              className={`relative p-6 transition-all duration-300 flex flex-col ${
                plan.popular
                  ? 'bg-[#141414] text-white z-10'
                  : 'bg-white border border-[#E5E5E5] hover:border-[#141414] hover:-translate-y-1'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center bg-white text-[#141414] px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-x-4">
                <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-[#141414]'}`}>
                  {plan.name}
                </h3>
              </div>

              <div className="mt-4 flex items-baseline gap-x-1">
                <span className={`text-3xl font-bold tracking-tight ${plan.popular ? 'text-white' : 'text-[#141414]'}`}>{plan.price}</span>
                {plan.period && <span className={`text-sm font-semibold leading-6 ${plan.popular ? 'text-white/60' : 'text-[#525252]'}`}>{plan.period}</span>}
              </div>

              <p className={`mt-4 text-sm leading-relaxed font-medium min-h-[40px] ${plan.popular ? 'text-white/60' : 'text-[#525252]'}`}>
                {plan.description}
              </p>

              <ul role="list" className={`mt-8 space-y-3 text-sm leading-6 flex-1 ${plan.popular ? 'text-white/80' : 'text-[#525252]'}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className={`h-5 w-4 flex-none ${plan.popular ? 'text-emerald-400' : 'text-emerald-600'}`} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 block px-3 py-3 text-center text-sm font-bold transition-all border ${
                  plan.popular
                    ? 'bg-white text-[#141414] border-white hover:bg-gray-100'
                    : 'bg-transparent text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-white'
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
