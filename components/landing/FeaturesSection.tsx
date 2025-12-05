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
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.5fr] lg:gap-24">
          {/* Sticky Left Column */}
          <div className="lg:sticky lg:top-32 lg:h-fit">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="text-sm font-medium uppercase tracking-wide text-indigo-500">Features</span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                Built for speed. <br />
                Designed for privacy.
              </h2>
              <p className="mt-6 text-lg text-gray-600 max-w-sm">
                Everything you need to deliver stunning galleries, without the feature bloat.
              </p>
            </motion.div>
          </div>

          {/* Right Column: Feature Stack */}
          <div className="flex flex-col gap-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="group relative pl-8 border-l-2 border-gray-100 hover:border-indigo-500 transition-colors duration-300"
              >
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white bg-gray-200 group-hover:bg-indigo-500 transition-colors duration-300 shadow-sm" />
                
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <feature.icon className="h-5 w-5" />
                </div>
                
                <h3 className="text-2xl font-medium text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-lg text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
