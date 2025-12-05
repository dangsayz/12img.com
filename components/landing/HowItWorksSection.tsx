'use client'

import { motion } from 'framer-motion'
import { UploadCloud, Link as LinkIcon, Eye } from 'lucide-react'

const steps = [
  {
    title: 'Upload',
    description: 'Drag & drop your high-res images. We handle the optimization.',
    icon: UploadCloud,
  },
  {
    title: 'Create Link',
    description: 'Get a beautiful, shareable link instantly. No complex setup.',
    icon: LinkIcon,
  },
  {
    title: 'Share & View',
    description: 'Clients view their gallery in a distraction-free, premium interface.',
    icon: Eye,
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-gray-50/50">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Simple by design. Powerful by nature.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-soft transition-all hover:shadow-lg"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-900 transition-colors group-hover:bg-gray-900 group-hover:text-white">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-medium text-gray-900">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
