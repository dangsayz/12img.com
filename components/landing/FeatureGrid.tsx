'use client'

import { motion } from 'framer-motion'
import { 
  ImageIcon, 
  FileText, 
  MessageCircle, 
  Users, 
  Calendar, 
  Zap
} from 'lucide-react'

const features = [
  {
    icon: ImageIcon,
    title: 'Beautiful Galleries',
    description: 'Stunning, mobile-first galleries your clients will love.',
  },
  {
    icon: FileText,
    title: 'Smart Contracts',
    description: 'Send, sign, and track contracts in minutes.',
  },
  {
    icon: MessageCircle,
    title: 'Client Portal',
    description: 'One place for messages, progress, and delivery.',
  },
  {
    icon: Users,
    title: 'Vendor Network',
    description: 'Share galleries with vendors, track downloads.',
  },
  {
    icon: Calendar,
    title: 'Automations',
    description: 'Scheduled emails that send themselves.',
  },
  {
    icon: Zap,
    title: 'Turbo Uploads',
    description: '600 photos in under 5 minutes.',
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="py-20 md:py-28 px-4 sm:px-6 bg-stone-50 scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">
            Everything you need
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-stone-900 tracking-tight">
            One platform. Zero chaos.
          </h2>
        </div>

        {/* Grid - 6 items, 3 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{ y: -4 }}
              className="group p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center mb-5">
                <feature.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              
              {/* Text */}
              <h3 className="font-medium text-stone-900 text-[15px] mb-2">
                {feature.title}
              </h3>
              <p className="text-[13px] text-stone-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
