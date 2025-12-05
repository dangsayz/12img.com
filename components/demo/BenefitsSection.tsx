'use client'

import { motion } from 'framer-motion'
import { Heart, Download, Smartphone, Palette, ArrowRight } from 'lucide-react'

const benefits = [
  {
    icon: Heart,
    title: 'Designed for weddings, not generic file sharing',
    description: 'Every feature is crafted with wedding photographers and their clients in mind.',
    color: 'rose',
    demoSection: 'demo-gallery',
  },
  {
    icon: Download,
    title: 'One-click ZIP download + automatic backups',
    description: 'Your clients get instant downloads. Their memories stay safe forever.',
    color: 'emerald',
    demoSection: 'demo-gallery',
  },
  {
    icon: Smartphone,
    title: 'Looks incredible on mobile phones',
    description: 'Responsive design that makes every photo shine on any device.',
    color: 'sky',
    demoSection: 'demo-gallery',
  },
  {
    icon: Palette,
    title: 'Built to match your brand',
    description: 'Custom logos, colors, and URLs that feel like an extension of your studio.',
    color: 'amber',
    demoSection: 'demo-gallery',
  },
]

export function BenefitsSection() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-20 lg:py-28 bg-[#1C1917]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white/70 mb-4">
            WHY PHOTOGRAPHERS SWITCH
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why photographers switch to 12img
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Join thousands of wedding photographers who deliver stunning gallery experiences to their clients.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              {/* Gradient Glow */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ${
                benefit.color === 'rose' ? 'bg-gradient-to-br from-rose-500/10 to-transparent' :
                benefit.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500/10 to-transparent' :
                benefit.color === 'sky' ? 'bg-gradient-to-br from-sky-500/10 to-transparent' :
                'bg-gradient-to-br from-amber-500/10 to-transparent'
              }`} />

              <div className="relative">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  benefit.color === 'rose' ? 'bg-rose-500/20' :
                  benefit.color === 'emerald' ? 'bg-emerald-500/20' :
                  benefit.color === 'sky' ? 'bg-sky-500/20' :
                  'bg-amber-500/20'
                }`}>
                  <benefit.icon className={`w-6 h-6 ${
                    benefit.color === 'rose' ? 'text-rose-400' :
                    benefit.color === 'emerald' ? 'text-emerald-400' :
                    benefit.color === 'sky' ? 'text-sky-400' :
                    'text-amber-400'
                  }`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  {benefit.description}
                </p>

                {/* Link */}
                <button
                  onClick={() => scrollToSection(benefit.demoSection)}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    benefit.color === 'rose' ? 'text-rose-400 hover:text-rose-300' :
                    benefit.color === 'emerald' ? 'text-emerald-400 hover:text-emerald-300' :
                    benefit.color === 'sky' ? 'text-sky-400 hover:text-sky-300' :
                    'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  See it in the demo
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
