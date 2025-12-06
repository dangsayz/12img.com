'use client'

import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { PricingButton } from '@/components/billing/PricingButton'

interface PricingCardProps {
  name: string
  planId: string
  description: string
  price: number
  period?: string
  features: string[]
  cta: string
  href?: string // deprecated, use planId
  popular?: boolean
  current?: boolean
  delay?: number
}

export function PricingCard({
  name,
  planId,
  description,
  price,
  period = '/month',
  features,
  cta,
  href,
  popular = false,
  current = false,
  delay = 0,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: popular ? -12 : -8, transition: { duration: 0.3 } }}
      className={`relative rounded-2xl p-7 transition-all duration-300 ${
        popular
          ? 'bg-[#1C1917] text-white shadow-2xl shadow-[#1C1917]/30 ring-2 ring-amber-400/20'
          : 'bg-white border border-[#E8E4DC] hover:border-amber-300 hover:shadow-xl'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="whitespace-nowrap bg-gradient-to-r from-amber-400 to-orange-400 text-[#1C1917] text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-5">
        <h3 className={`text-xl font-semibold mb-1 ${popular ? 'text-white' : 'text-[#1C1917]'}`}>
          {name}
        </h3>
        <p className={`text-sm ${popular ? 'text-white/60' : 'text-[#78716C]'}`}>
          {description}
        </p>
      </div>

      <div className="mb-6">
        <span className={`text-4xl font-bold ${popular ? 'text-white' : 'text-[#1C1917]'}`}>
          ${price}
        </span>
        <span className={`text-sm ml-1 ${popular ? 'text-white/60' : 'text-[#78716C]'}`}>
          {period}
        </span>
      </div>

      <PricingButton
        planId={planId}
        className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all mb-6 cursor-pointer ${
          current
            ? 'bg-[#E8E4DC] text-[#78716C] cursor-default'
            : popular
            ? 'bg-white text-[#1C1917] hover:bg-amber-50 shadow-lg'
            : 'bg-stone-100 text-[#1C1917] hover:bg-stone-200'
        }`}
      >
        {cta}
      </PricingButton>

      <ul className="space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className={`w-4 h-4 flex-shrink-0 ${popular ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`text-sm ${popular ? 'text-white/90' : 'text-[#1C1917]'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
