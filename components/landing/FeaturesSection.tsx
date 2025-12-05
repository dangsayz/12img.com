'use client'

import { motion } from 'framer-motion'
import { Zap, Lock, Download } from 'lucide-react'

const features = [
  {
    title: 'Uploads at the speed of light',
    description: 'Drag, drop, done. Our concurrent upload pipeline handles hundreds of images in seconds.',
    icon: Zap,
  },
  {
    title: 'Password protected by default',
    description: 'Every gallery gets a secure access code. You control who sees your work.',
    icon: Lock,
  },
  {
    title: 'One-click zip downloads',
    description: 'Clients can download their entire gallery or individual selects with a single click.',
    icon: Download,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-soft-bg relative overflow-hidden scroll-mt-20">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-white/40 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.5fr] lg:gap-24">
          {/* Sticky Left Column */}
          <div className="lg:sticky lg:top-32 lg:h-fit">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block rounded-full bg-white border border-white/60 shadow-sm px-4 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Features
              </span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Built for speed. <br />
                Designed for privacy.
              </h2>
              <p className="mt-6 text-lg text-gray-500 max-w-sm font-medium leading-relaxed">
                Everything you need to deliver stunning galleries, without the feature bloat.
              </p>
            </motion.div>
          </div>

          {/* Right Column: Feature Stack */}
          <div className="flex flex-col gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                className="group relative p-8 bg-white rounded-[24px] shadow-neumorphic-sm border border-white/60 hover:shadow-neumorphic-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-soft-bg text-gray-900 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-6 w-6" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="mt-2 text-gray-500 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
