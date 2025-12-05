'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
      {/* Background Orb */}
      <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4">
        <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/20 blur-3xl lg:h-[800px] lg:w-[800px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 lg:items-center">
          {/* Left Column: Copy */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-col items-start text-left"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-block rounded-full border border-black/5 bg-white/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
                For Photographers
              </span>
            </motion.div>
            
            <motion.h1
              variants={fadeInUp}
              className="mt-6 text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl"
            >
              Share your work, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
                beautifully.
              </span>
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg"
            >
              Ultra-minimal client galleries. No clutter. Just your images presented in a cinematic, distraction-free environment.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="mt-10 flex items-center gap-4">
              <Link href="/sign-up" className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-gray-950 px-8 font-medium text-white transition-transform active:scale-95">
                <div className="absolute inset-0 flex items-center [container-type:inline-size]">
                  <div className="absolute h-[100w] w-[100w] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,theme(colors.gray.950)_0%,theme(colors.indigo.500)_50%,theme(colors.gray.950)_100%)]" />
                </div>
                <span className="absolute inset-[1px] rounded-full bg-gray-950" />
                <span className="relative flex items-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              
              <Link href="/view/demo" className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 transition-colors">
                View Demo <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -20 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative mx-auto w-full max-w-[500px] lg:max-w-none perspective-1000"
          >
            {/* Glass Card */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
              {/* Fake Gallery Grid */}
              <div className="grid h-full grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden rounded-lg bg-gray-200 ${
                      i === 0 ? 'col-span-2 row-span-2' : ''
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300" />
                  </div>
                ))}
              </div>
              
              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-xl bg-white/80 p-4 backdrop-blur-md shadow-lg">
                <div>
                  <div className="h-2 w-24 rounded-full bg-gray-200 mb-2" />
                  <div className="h-2 w-16 rounded-full bg-gray-100" />
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-500/20" />
              </div>
            </div>
            
            {/* Decorative Blur Behind */}
            <div className="absolute -inset-4 -z-10 bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 blur-2xl rounded-[2rem] opacity-50" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
