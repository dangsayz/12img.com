'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'

// Apple-style easing
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const sections = [
  {
    id: 'collect',
    title: 'What we collect',
    items: [
      {
        label: 'Account Information',
        description: 'Email address and name when you sign up',
      },
      {
        label: 'Gallery Content',
        description: 'Photos you upload to share with clients',
      },
      {
        label: 'Usage Data',
        description: 'How you interact with our service',
      },
    ],
  },
  {
    id: 'use',
    title: 'How we use it',
    items: [
      {
        label: 'Service Delivery',
        description: 'To provide and maintain your galleries',
      },
      {
        label: 'Communication',
        description: 'To notify you about important changes',
      },
      {
        label: 'Support',
        description: 'To help you when you need assistance',
      },
      {
        label: 'Improvement',
        description: 'To detect and prevent technical issues',
      },
    ],
  },
  {
    id: 'share',
    title: 'Who we share with',
    items: [
      {
        label: 'Supabase',
        description: 'Database and file storage infrastructure',
      },
      {
        label: 'Clerk',
        description: 'Secure authentication services',
      },
      {
        label: 'Legal Authorities',
        description: 'Only when required by law',
      },
    ],
  },
  {
    id: 'rights',
    title: 'Your rights',
    items: [
      {
        label: 'Access',
        description: 'Download all your data anytime',
      },
      {
        label: 'Delete',
        description: 'Remove your account and all associated data',
      },
      {
        label: 'Update',
        description: 'Modify your information at any time',
      },
      {
        label: 'Export',
        description: 'Take your galleries with you',
      },
    ],
  },
]

const securityHighlights = [
  { stat: 'AES-256', label: 'Encryption at rest' },
  { stat: 'TLS 1.3', label: 'Encryption in transit' },
  { stat: '60 min', label: 'URL expiration' },
  { stat: 'Zero', label: 'Third-party access' },
]

export function PrivacyPageClient() {
  return (
    <div className="min-h-screen bg-stone-50">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 mb-6">
              Privacy Policy
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-stone-900 tracking-[-0.02em] mb-6">
              Simple, honest,
              <br />
              <span className="font-normal">transparent.</span>
            </h1>
            <p className="text-lg text-stone-500 font-light max-w-xl leading-relaxed">
              We believe privacy policies should be readable. Here's exactly what we collect, 
              why we collect it, and how we protect it.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-8 text-sm text-stone-400"
          >
            Last updated: December 2024
          </motion.div>
        </div>
      </section>

      {/* Photo Security Highlight */}
      <section className="py-20 px-6 bg-stone-900 text-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease }}
            className="mb-16"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-4">
              Photo Security
            </p>
            <h2 className="text-2xl sm:text-3xl font-light tracking-[-0.01em] max-w-2xl">
              Your photos are stored in private cloud infrastructure with enterprise-grade protection.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone-800">
            {securityHighlights.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.1 }}
                className="bg-stone-900 p-6 sm:p-8"
              >
                <p className="text-2xl sm:text-3xl font-light tracking-tight mb-2">
                  {item.stat}
                </p>
                <p className="text-xs text-stone-500">{item.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <Link
              href="/security"
              className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-white transition-colors group"
            >
              <span>View full security details</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease }}
              className="mb-24 last:mb-0"
            >
              {/* Section header */}
              <div className="flex items-baseline gap-4 mb-10">
                <span className="text-[10px] tracking-[0.2em] text-stone-400 font-medium">
                  {String(sectionIndex + 1).padStart(2, '0')}
                </span>
                <h2 className="text-2xl font-light text-stone-900 tracking-[-0.01em]">
                  {section.title}
                </h2>
              </div>

              {/* Items */}
              <div className="space-y-0">
                {section.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease, delay: itemIndex * 0.05 }}
                    className="group grid md:grid-cols-3 gap-4 py-6 border-t border-stone-200 hover:border-stone-300 transition-colors"
                  >
                    <div className="md:col-span-1">
                      <h3 className="font-medium text-stone-900 group-hover:translate-x-1 transition-transform duration-300">
                        {item.label}
                      </h3>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-stone-500 font-light">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Promise */}
      <section className="py-24 px-6 border-t border-stone-200">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
          >
            <div className="w-12 h-px bg-stone-300 mx-auto mb-12" />
            <p className="text-xl sm:text-2xl font-light text-stone-900 leading-relaxed mb-12">
              We will never sell your data. We will never use your photos for anything 
              other than displaying them in your galleries. Your trust is our foundation.
            </p>
            <p className="text-sm text-stone-500">
              Questions?{' '}
              <a
                href="mailto:privacy@12img.com"
                className="text-stone-900 underline underline-offset-4 hover:no-underline"
              >
                privacy@12img.com
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-stone-200">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-stone-900 flex items-center justify-center">
              <span className="text-white font-bold text-[8px] tracking-tighter">12</span>
            </div>
            <span className="font-serif text-lg font-medium tracking-tight text-stone-900">img</span>
          </Link>
          <div className="flex items-center gap-8 text-sm text-stone-500">
            <Link href="/security" className="hover:text-stone-900 transition-colors">
              Security
            </Link>
            <Link href="/terms" className="hover:text-stone-900 transition-colors">
              Terms
            </Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
