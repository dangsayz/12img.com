'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  ImageIcon, 
  FileText, 
  MessageCircle, 
  Users, 
  Calendar, 
  Mail,
  Check,
  Zap,
  Shield,
  Download,
  BarChart3,
  BookOpen
} from 'lucide-react'

const categories = [
  {
    id: 'galleries',
    label: 'Galleries',
    title: 'Beautiful galleries that convert',
    description: 'Mobile-first design, lightning-fast uploads, and smart image handling that makes your work shine.',
    image: '/images/showcase/modern-wedding-gallery-02.jpg',
    features: [
      { icon: ImageIcon, text: 'Stunning responsive layouts' },
      { icon: Zap, text: '600 photos uploaded in under 5 minutes' },
      { icon: Shield, text: 'Password protection & expiry dates' },
      { icon: Download, text: 'One-click ZIP downloads for clients' },
    ]
  },
  {
    id: 'clients',
    label: 'Client Portal',
    title: 'One place for everything',
    description: 'Contracts, messages, progress updates, and delivery—all in a branded portal your clients will love.',
    image: '/images/showcase 2/CaseyxStacyxdnpixelsweddingphotos-374.jpg',
    features: [
      { icon: FileText, text: 'Send & sign contracts digitally' },
      { icon: MessageCircle, text: 'Built-in messaging with read receipts' },
      { icon: BarChart3, text: 'Delivery countdown & milestones' },
      { icon: Mail, text: 'Email tracking—know when they view' },
    ]
  },
  {
    id: 'automation',
    label: 'Automation',
    title: 'Work less, deliver more',
    description: 'Scheduled emails, vendor sharing, and smart workflows that run while you sleep.',
    image: '/images/showcase/modern-wedding-gallery-02.jpg',
    features: [
      { icon: Calendar, text: 'Automated reminder emails' },
      { icon: Users, text: 'Share with vendors, track downloads' },
      { icon: BookOpen, text: 'Magazine-style editorial layouts' },
      { icon: Check, text: 'Milestone tracking & notifications' },
    ]
  },
]

export function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState('galleries')
  const activeCategory = categories.find(c => c.id === activeTab) || categories[0]

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-stone-900 tracking-tight">
            Everything in one place
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-stone-100 rounded-full p-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`relative px-6 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                  activeTab === category.id
                    ? 'text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {activeTab === category.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-stone-900 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left: Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 shadow-2xl">
                <Image
                  src={activeCategory.image}
                  alt={activeCategory.title}
                  fill
                  className="object-cover"
                />
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-stone-100 rounded-2xl -z-10" />
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-stone-50 rounded-xl -z-10" />
            </div>

            {/* Right: Content */}
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl sm:text-3xl font-light text-stone-900 mb-4">
                {activeCategory.title}
              </h3>
              <p className="text-stone-500 text-lg mb-8 leading-relaxed">
                {activeCategory.description}
              </p>

              {/* Feature list */}
              <div className="space-y-4">
                {activeCategory.features.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-stone-700" strokeWidth={1.5} />
                    </div>
                    <span className="text-stone-700">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
