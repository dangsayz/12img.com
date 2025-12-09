'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'

// Apple-style easing
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const securityLayers = [
  {
    number: '01',
    title: 'Private Cloud Storage',
    subtitle: 'AWS S3 Infrastructure',
    description: 'Your images live in private, non-public storage buckets. No guessable URLs. Every access request requires cryptographic verification.',
    detail: 'Built on Supabase Storage, powered by AWS S3—the same infrastructure trusted by Netflix, Airbnb, and NASA.',
  },
  {
    number: '02',
    title: 'Time-Limited Access',
    subtitle: 'Signed URL Technology',
    description: 'Every image URL expires within 60 minutes. Even if intercepted, links become useless—preventing unauthorized redistribution.',
    detail: 'HMAC-SHA256 signatures ensure URLs cannot be forged or extended.',
  },
  {
    number: '03',
    title: 'End-to-End Encryption',
    subtitle: 'Bank-Grade Security',
    description: 'TLS 1.3 in transit. AES-256 at rest. Password-protected galleries use bcrypt—the same algorithm protecting financial institutions.',
    detail: 'Your data is encrypted before it leaves your browser and stays encrypted until displayed.',
  },
  {
    number: '04',
    title: 'Ownership Enforcement',
    subtitle: 'Row Level Security',
    description: 'Database policies enforce ownership at the query level. Only you can upload, modify, or delete your images.',
    detail: 'Even our own team cannot access your photos without explicit authorization.',
  },
  {
    number: '05',
    title: 'Zero Third-Party Access',
    subtitle: 'Your Photos, Your Rights',
    description: 'We never share, sell, analyze, or train AI on your images. Your work is displayed only in your galleries.',
    detail: 'No exceptions. No fine print. Your photos remain 100% yours.',
  },
]

const certifications = [
  { name: 'SOC 2 Type II', description: 'Security & availability' },
  { name: 'GDPR', description: 'EU data protection' },
  { name: 'CCPA', description: 'California privacy' },
  { name: 'ISO 27001', description: 'Information security' },
]

export function SecurityPageClient() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <div ref={containerRef} className="min-h-screen bg-stone-50">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #000 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full mb-8"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs tracking-[0.2em] uppercase text-stone-500">
              Enterprise Security
            </span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.1 }}
            className="text-5xl sm:text-7xl md:text-8xl font-light text-stone-900 tracking-[-0.02em] mb-6"
          >
            Your work,
            <br />
            <span className="font-normal">protected.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.2 }}
            className="text-lg sm:text-xl text-stone-500 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Five layers of security stand between your photos and unauthorized access. 
            The same infrastructure trusted by Fortune 500 companies.
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-6 h-10 border border-stone-300 rounded-full flex justify-center pt-2"
            >
              <motion.div className="w-1 h-2 bg-stone-400 rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Security Layers */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease }}
            className="mb-24"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 mb-4">
              Security Architecture
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-stone-900 tracking-[-0.01em]">
              Five layers of protection
            </h2>
          </motion.div>

          {/* Layers */}
          <div className="space-y-0">
            {securityLayers.map((layer, index) => (
              <SecurityLayer key={layer.number} layer={layer} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs - Minimal Grid */}
      <section className="py-32 px-6 bg-stone-900 text-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease }}
            className="mb-20"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-4">
              Technical Specifications
            </p>
            <h2 className="text-3xl sm:text-4xl font-light tracking-[-0.01em]">
              Built on proven infrastructure
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-stone-800">
            {[
              { label: 'Encryption', value: 'AES-256', sub: 'At rest' },
              { label: 'Transport', value: 'TLS 1.3', sub: 'In transit' },
              { label: 'Hashing', value: 'bcrypt', sub: 'Passwords' },
              { label: 'Signatures', value: 'HMAC-SHA256', sub: 'URLs' },
            ].map((spec, i) => (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.1 }}
                className="bg-stone-900 p-8"
              >
                <p className="text-[10px] tracking-[0.2em] uppercase text-stone-500 mb-2">
                  {spec.label}
                </p>
                <p className="text-2xl font-light tracking-tight mb-1">{spec.value}</p>
                <p className="text-xs text-stone-500">{spec.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Infrastructure providers */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease, delay: 0.4 }}
            className="mt-20 pt-20 border-t border-stone-800"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-8">
              Infrastructure Partners
            </p>
            <div className="flex flex-wrap gap-12 text-stone-400">
              {['Supabase', 'AWS', 'Vercel', 'Clerk'].map((partner) => (
                <span key={partner} className="text-lg font-light">
                  {partner}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease }}
            className="text-center mb-20"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 mb-4">
              Compliance
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-stone-900 tracking-[-0.01em]">
              Industry certifications
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, i) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.1 }}
                className="group relative p-8 border border-stone-200 rounded-2xl hover:border-stone-300 transition-colors duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-stone-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                <div className="relative">
                  <p className="text-xl font-light text-stone-900 mb-2">{cert.name}</p>
                  <p className="text-sm text-stone-500">{cert.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promise Section */}
      <section className="py-32 px-6 border-t border-stone-200">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease }}
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 mb-8">
              Our Promise
            </p>
            <blockquote className="text-2xl sm:text-3xl md:text-4xl font-light text-stone-900 leading-relaxed tracking-[-0.01em] mb-12">
              "Your photos are your livelihood and your clients' most precious memories. 
              We treat them with the security they deserve."
            </blockquote>
            <div className="w-12 h-px bg-stone-300 mx-auto mb-8" />
            <p className="text-sm text-stone-500">
              Questions about security?{' '}
              <a
                href="mailto:security@12img.com"
                className="text-stone-900 underline underline-offset-4 hover:no-underline transition-all"
              >
                security@12img.com
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-stone-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-stone-900 flex items-center justify-center">
              <span className="text-white font-bold text-[8px] tracking-tighter">12</span>
            </div>
            <span className="font-serif text-lg font-medium tracking-tight text-stone-900">img</span>
          </Link>
          <div className="flex items-center gap-8 text-sm text-stone-500">
            <Link href="/privacy" className="hover:text-stone-900 transition-colors">
              Privacy
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

function SecurityLayer({
  layer,
  index,
}: {
  layer: typeof securityLayers[0]
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease, delay: index * 0.1 }}
      className="group"
    >
      <div className="grid md:grid-cols-12 gap-6 py-12 border-t border-stone-200 group-hover:border-stone-300 transition-colors duration-500">
        {/* Number */}
        <div className="md:col-span-1">
          <span className="text-[10px] tracking-[0.2em] text-stone-400 font-medium">
            {layer.number}
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="md:col-span-4">
          <h3 className="text-xl font-light text-stone-900 mb-1 group-hover:translate-x-1 transition-transform duration-500">
            {layer.title}
          </h3>
          <p className="text-xs tracking-[0.15em] uppercase text-stone-400">
            {layer.subtitle}
          </p>
        </div>

        {/* Description */}
        <div className="md:col-span-4">
          <p className="text-stone-600 font-light leading-relaxed">
            {layer.description}
          </p>
        </div>

        {/* Detail */}
        <div className="md:col-span-3">
          <p className="text-sm text-stone-400 font-light leading-relaxed">
            {layer.detail}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
