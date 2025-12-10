'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  Check, 
  MessageCircle, 
  Mail, 
  FileText, 
  Upload, 
  ArrowRight,
  Smartphone
} from 'lucide-react'

export function FeatureBento() {
  return (
    <>
      {/* Section 1: Client Experience */}
      <section className="py-20 md:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">
              Client Experience
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-stone-900 tracking-tight max-w-3xl mx-auto">
              End the "when will my gallery be ready?" texts
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-2 md:grid-rows-2 gap-6">
            
            {/* Card 1: Client Portal - Large */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-stone-50 rounded-3xl p-8 md:row-span-2 flex flex-col"
            >
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2">Client Portal</p>
                <h3 className="text-2xl font-light text-stone-900 mb-3">
                  One place. Zero chaos.
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Give every client their own portal. They see real-time progress, delivery dates, and can message you in one place.
                </p>
              </div>

              {/* Before/After Mockup */}
              <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Before */}
                <div className="relative">
                  <p className="text-[9px] uppercase tracking-wider text-stone-400 mb-2 text-center">Before</p>
                  <div className="bg-white rounded-xl p-3 border border-stone-200 space-y-2">
                    {/* iMessage */}
                    <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                      <div className="w-7 h-7 rounded-lg bg-[#34C759] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.04 2 11c0 2.62 1.23 4.98 3.16 6.57L4 22l4.43-1.16C9.56 21.27 10.75 21.5 12 21.5c5.52 0 10-4.04 10-9S17.52 2 12 2z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-stone-600 truncate">Any update on photos?</p>
                      </div>
                    </div>
                    {/* Instagram */}
                    <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-stone-600 truncate">Hey! When will...</p>
                      </div>
                    </div>
                    {/* Gmail */}
                    <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                      <div className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                          <path fill="#34A853" d="M0 19.366V5.457L12 14.182 0 19.366z" opacity="0"/>
                          <path fill="#4285F4" d="M24 5.457L12 14.182 0 5.457" opacity="0"/>
                          <path fill="#FBBC05" d="M24 19.366L12 14.182l12-8.725v13.909z" opacity="0"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-stone-600 truncate">Following up on...</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-stone-400 text-center pt-1">Scattered everywhere</p>
                  </div>
                </div>

                {/* After */}
                <div className="relative">
                  <p className="text-[9px] uppercase tracking-wider text-stone-400 mb-2 text-center">After</p>
                  <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center text-white text-[10px] font-medium">SJ</div>
                      <div>
                        <p className="text-[11px] font-medium text-stone-900">Client Portal</p>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[9px] text-stone-400">Online</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[9px] text-stone-500 mb-1">
                          <span>Progress</span>
                          <span>65%</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full w-[65%] bg-stone-900 rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-stone-500">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Event completed</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-stone-500">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Editing in progress</span>
                      </div>
                      <div className="pt-2 border-t border-stone-100">
                        <p className="text-[9px] text-stone-400">Delivery</p>
                        <p className="text-sm font-medium text-stone-900">Dec 22</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Mobile Experience */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-stone-900 rounded-3xl p-8 text-white overflow-hidden relative h-full flex flex-col justify-center"
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-light mb-2">Mobile-first galleries</h3>
                <p className="text-stone-400 text-sm leading-relaxed">
                  80% of clients view on their phones. Your galleries look stunning on any screen.
                </p>
              </div>
              {/* Decorative phone mockup */}
              <div className="absolute -bottom-8 -right-4 w-32 opacity-20">
                <div className="bg-white/20 rounded-[1.5rem] p-1 aspect-[9/19]" />
              </div>
            </motion.div>

            {/* Card 3: Email Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-stone-50 rounded-3xl p-8 h-full flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2">Email Tracking</p>
                  <h3 className="text-xl font-light text-stone-900">Know when they view</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-stone-600" />
                </div>
              </div>
              
              {/* Email Activity Mockup */}
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-stone-400" />
                  <span className="text-xs font-medium text-stone-700">Email Activity</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-stone-600">sarah@email.com</span>
                    </div>
                    <span className="text-[10px] text-stone-400">Opened • Downloaded</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-stone-600">john@email.com</span>
                    </div>
                    <span className="text-[10px] text-stone-400">Opened • 2h ago</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-stone-300" />
                      <span className="text-xs text-stone-600">mom@email.com</span>
                    </div>
                    <span className="text-[10px] text-stone-400">Sent • Pending</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2: Workflow Automation */}
      <section className="py-20 md:py-32 px-4 sm:px-6 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">
              Workflow
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-stone-900 tracking-tight max-w-3xl mx-auto">
              Work less, deliver more
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Card 1: Contracts - Spans 2 columns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-8 md:col-span-2"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1.5 rounded-full bg-stone-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stone-600" />
                  <span className="text-xs font-medium text-stone-700">Smart Contracts</span>
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-light text-stone-900 mb-2">
                Contracts that <em className="font-serif">close deals</em>
              </h3>
              <p className="text-stone-500 text-sm mb-6 max-w-md">
                Professional contracts with built-in e-signatures. Send, track, and get signed—all without leaving 12img.
              </p>

              {/* Contract Mockup */}
              <div className="bg-stone-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-stone-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">Wedding Photography Agreement</p>
                      <p className="text-xs text-stone-500">Sarah & James • June 15, 2025</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Signed
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-stone-200">
                    <p className="text-[10px] text-stone-400 mb-1">1</p>
                    <p className="text-xs font-medium text-stone-700">Services & Coverage</p>
                    <p className="text-[11px] text-stone-500 mt-1">Provider agrees to deliver 8 hours of professional...</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-stone-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2">
                        <Check className="w-4 h-4 text-stone-600" />
                      </div>
                      <p className="text-xs text-stone-500">Client Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Auto Backups */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-3xl p-8"
            >
              <h3 className="text-xl font-light text-stone-900 mb-1">
                Automatic Backups
              </h3>
              <p className="text-stone-500 text-sm mb-6">
                Every gallery gets a ZIP archive emailed to you. Peace of mind, included.
              </p>

              {/* Backup Flow */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5 text-stone-600" />
                  </div>
                  <p className="text-[10px] text-stone-500">Upload</p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-stone-600 flex items-center justify-center mb-2">
                    <span className="text-white text-[10px] font-bold">ZIP</span>
                  </div>
                  <p className="text-[10px] text-stone-500">Archive</p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-2 border-2 border-dashed border-stone-300">
                    <Mail className="w-5 h-5 text-stone-400" />
                  </div>
                  <p className="text-[10px] text-stone-500">Email</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
