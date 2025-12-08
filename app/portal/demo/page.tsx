'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, MessageSquare, Image, ChevronRight, Calendar, MapPin, ArrowLeft } from 'lucide-react'

export default function PortalDemoPage() {
  // Demo data
  const client = {
    firstName: 'Sarah',
    lastName: 'Mitchell',
    partnerFirstName: 'James',
    eventType: 'wedding',
    eventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    eventLocation: 'The Grand Estate, Napa Valley',
  }
  const photographerName = 'Alexandra Chen Photography'
  const daysUntil = 45

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Demo Banner */}
      <div className="bg-stone-900 text-white py-2 px-4 text-center text-sm">
        <span className="opacity-75">This is a demo of the client portal.</span>
        <Link href="/" className="ml-2 underline hover:no-underline">
          Return to 12img →
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-sm text-stone-500 mb-1">Welcome to your client portal</p>
          <h1 className="text-2xl font-light text-stone-900">{photographerName}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Client Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-stone-200 p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-medium text-stone-600">
                {client.firstName[0]}
                {client.lastName[0]}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-medium text-stone-900">
                {client.firstName} {client.lastName}
                {client.partnerFirstName && (
                  <span className="text-stone-500"> & {client.partnerFirstName}</span>
                )}
              </h2>
              <p className="text-sm text-stone-500">Wedding</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Calendar className="w-4 h-4 text-stone-400" />
              <span>
                {client.eventDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="text-amber-600 font-medium">({daysUntil} days)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <MapPin className="w-4 h-4 text-stone-400" />
              <span>{client.eventLocation}</span>
            </div>
          </div>
        </motion.div>

        {/* Action Cards */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link
              href="/portal/demo/contract"
              className="flex items-center gap-4 p-5 bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-stone-900">View Contract</h3>
                <p className="text-sm text-stone-500">
                  Review and sign your photography contract
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-stone-200 opacity-75 cursor-not-allowed">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-stone-900">Messages</h3>
                <p className="text-sm text-stone-500">Chat with your photographer</p>
              </div>
              <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">Demo</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-stone-200 opacity-75 cursor-not-allowed">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Image className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-stone-900">Photo Gallery</h3>
                <p className="text-sm text-stone-500">View and download your photos</p>
              </div>
              <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">Demo</span>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-xs text-stone-400">
            Powered by{' '}
            <a href="/" className="hover:text-stone-600 transition-colors">
              12IMG
            </a>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
