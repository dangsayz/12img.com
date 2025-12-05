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
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32 bg-soft-bg">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-white/60 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-soft-lime/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Left Column: Copy */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-col items-start text-left"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-block rounded-full bg-white border border-white/60 shadow-sm px-4 py-1.5 text-sm font-medium text-gray-500">
                For Photographers
              </span>
            </motion.div>
            
            <motion.h1
              variants={fadeInUp}
              className="mt-8 text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl"
            >
              Share your work, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-300">
                beautifully.
              </span>
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="mt-8 text-lg text-gray-500 leading-relaxed max-w-lg font-medium"
            >
              Ultra-minimal client galleries. No clutter. Just your images presented in a cinematic, distraction-free environment.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="mt-10 flex items-center gap-4">
              <Link href="/sign-up" className="group inline-flex h-14 items-center justify-center rounded-[20px] bg-gray-900 px-8 font-bold text-white transition-all hover:bg-gray-800 hover:scale-[1.02] shadow-neumorphic-md hover:shadow-neumorphic-lg">
                <span className="flex items-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              
              <Link href="/view/demo" className="px-6 py-4 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors bg-white rounded-[20px] shadow-neumorphic-sm border border-white/60 hover:border-white">
                View Demo
              </Link>
            </motion.div>
            
            {/* Trust Badge */}
            <motion.div variants={fadeInUp} className="mt-12 flex items-center gap-4 text-sm font-medium text-gray-400">
              <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-soft-bg bg-gray-200 overflow-hidden">
                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="User" />
                   </div>
                 ))}
              </div>
              <p>Trusted by 2,000+ photographers</p>
            </motion.div>
          </motion.div>

          {/* Right Column: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: -5 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative mx-auto w-full max-w-[500px] lg:max-w-none perspective-1000"
          >
             {/* Clean 3D Card Stack */}
             <div className="relative h-[600px] w-full flex items-center justify-center transform-style-3d">
               {/* Back Card */}
               <motion.div 
                 className="absolute w-[300px] h-[400px] bg-white rounded-[32px] shadow-soft-xl border border-white/50 z-10 opacity-60"
                 animate={{ rotate: -6, x: -40, y: 10 }}
               />
               
               {/* Middle Card */}
               <motion.div 
                 className="absolute w-[300px] h-[400px] bg-white rounded-[32px] shadow-soft-xl border border-white/50 z-20 opacity-80"
                 animate={{ rotate: 6, x: 40, y: -10 }}
               />

               {/* Main Card (Front) */}
               <motion.div 
                 className="absolute w-[340px] h-[460px] bg-white rounded-[32px] shadow-neumorphic-float border border-white/80 z-30 overflow-hidden p-3"
                 animate={{ y: [0, -15, 0] }}
                 transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
               >
                 <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-gray-100">
                   <img 
                     src="/images/showcase/modern-wedding-gallery-07.jpg" 
                     alt="Gallery Preview" 
                     className="w-full h-full object-cover"
                   />
                   
                   {/* Glass Overlay Badge */}
                   <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/80 backdrop-blur-md rounded-[20px] shadow-sm border border-white/50 flex items-center justify-between">
                     <div>
                       <p className="text-sm font-bold text-gray-900">Sarah & Tom</p>
                       <p className="text-xs text-gray-500">24 Photos • Just now</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                       ↗
                     </div>
                   </div>
                 </div>
               </motion.div>
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
