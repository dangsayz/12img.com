'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, MessageCircle, TrendingUp, Users, Gift, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLANS, PRICING, formatPrice } from '@/lib/config/pricing'

// Get the Pro plan for the pricing teaser
const proPlan = PLANS.find(p => p.id === 'pro')!

const photographerBenefits = [
  {
    icon: MessageCircle,
    title: 'Less support emails',
    description: 'Simple galleries mean fewer confused clients asking how to download.',
  },
  {
    icon: TrendingUp,
    title: 'Easier upsells',
    description: 'Beautiful presentation makes album and print upsells a breeze.',
  },
  {
    icon: Users,
    title: 'More referrals',
    description: 'Clients share their galleries with friends — your next booking source.',
  },
]

// Use features from the Pro plan
const pricingFeatures = proPlan.features.slice(0, 5)

export function PhotographerSection() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-[#FAF8F5] to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-xs font-medium text-amber-800 mb-4">
            FOR PHOTOGRAPHERS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] mb-4 max-w-3xl mx-auto leading-tight">
            Give your clients a gallery experience they can't stop sharing
          </h2>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {photographerBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#1C1917] flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1C1917] mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-[#78716C] leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Testimonial Quote */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8 p-6 bg-white rounded-2xl border border-[#E8E4DC] shadow-sm"
            >
              <p className="text-[#44403C] italic mb-4">
                "My clients always comment on how easy and beautiful the galleries are.
                It's become part of my brand now."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                  SM
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">Sarah Mitchell</p>
                  <p className="text-xs text-[#78716C]">Wedding Photographer, Austin TX</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Pricing Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white rounded-3xl border border-[#E8E4DC] shadow-xl p-8 relative overflow-hidden">
              {/* Free Tier Badge */}
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                  <Gift className="w-3 h-3 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">Free tier available</span>
                </div>
              </div>

              {/* Pricing Header */}
              <div className="mb-8">
                <p className="text-sm text-[#78716C] mb-2">{proPlan.name} Plan</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-[#1C1917]">${proPlan.monthlyPrice}</span>
                  <span className="text-[#78716C]">/month</span>
                </div>
                <p className="text-sm text-[#A8A29E] mt-1">or ${proPlan.yearlyPrice}/year</p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {pricingFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-[#44403C]">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link href={`/sign-up?plan=${proPlan.id}`} className="block">
                <Button size="lg" className="w-full group">
                  {proPlan.cta}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <p className="text-center text-xs text-[#A8A29E] mt-4">
                No credit card required to start
              </p>

              {/* Decorative gradient */}
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
