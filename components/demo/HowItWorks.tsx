'use client'

import { motion } from 'framer-motion'
import { Upload, Share2, Download, Camera, Users } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload',
    description: 'Drag & drop your RAWs or JPEGs. We generate a beautiful gallery in seconds.',
    caption: 'Photographer view',
    color: 'amber',
  },
  {
    number: '02',
    icon: Share2,
    title: 'Share',
    description: 'Send a single link to your clients with built-in password protection.',
    caption: 'One click sharing',
    color: 'emerald',
  },
  {
    number: '03',
    icon: Download,
    title: 'Download & Backup',
    description: 'Clients download everything in one click, and we automatically back it up.',
    caption: 'Client view',
    color: 'sky',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#F5F5F4] text-xs font-medium text-[#78716C] mb-4">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] mb-4">
            From upload to delivery in 3 simple steps
          </h2>
          <p className="text-[#78716C] max-w-2xl mx-auto">
            No complicated setup. No learning curve. Just drag, share, and done.
          </p>
        </motion.div>

        {/* Steps - Horizontal on desktop, vertical on mobile */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5">
            <div className="h-full bg-gradient-to-r from-amber-200 via-emerald-200 to-sky-200 rounded-full" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {/* Mobile Connection Line */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden absolute left-6 top-20 w-0.5 h-full bg-gradient-to-b from-[#E8E4DC] to-transparent" />
                )}

                <div className="flex flex-col items-center text-center lg:text-center">
                  {/* Step Number & Icon */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${
                      step.color === 'amber' ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                      step.color === 'emerald' ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' :
                      'bg-gradient-to-br from-sky-400 to-sky-500'
                    }`}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                    
                    {/* Step number badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1C1917] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{step.number}</span>
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-[#1C1917]">
                      {step.title}
                    </h3>
                    <p className="text-[#78716C] leading-relaxed max-w-xs mx-auto">
                      {step.description}
                    </p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      step.color === 'amber' ? 'text-amber-600' :
                      step.color === 'emerald' ? 'text-emerald-600' :
                      'text-sky-600'
                    }`}>
                      {step.caption === 'Photographer view' && <Camera className="w-3 h-3" />}
                      {step.caption === 'Client view' && <Users className="w-3 h-3" />}
                      {step.caption}
                    </span>
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
