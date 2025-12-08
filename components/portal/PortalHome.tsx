'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, MessageSquare, Image, ChevronRight, Calendar, MapPin } from 'lucide-react'
import { type PortalData } from '@/server/actions/portal.actions'
import { EVENT_TYPE_LABELS } from '@/lib/contracts/types'

interface PortalHomeProps {
  data: PortalData
  token: string
}

export function PortalHome({ data, token }: PortalHomeProps) {
  const { client, photographerName, permissions } = data

  const eventDate = client.eventDate ? new Date(client.eventDate) : null
  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-stone-50">
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
              <p className="text-sm text-stone-500">{EVENT_TYPE_LABELS[client.eventType]}</p>
            </div>
          </div>

          {(eventDate || client.eventLocation) && (
            <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-4">
              {eventDate && (
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span>
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {daysUntil !== null && daysUntil > 0 && daysUntil <= 30 && (
                    <span className="text-amber-600 font-medium">({daysUntil} days)</span>
                  )}
                </div>
              )}
              {client.eventLocation && (
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  <span>{client.eventLocation}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Action Cards */}
        <div className="space-y-3">
          {permissions.canViewContract && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link
                href={`/portal/${token}/contract`}
                className="flex items-center gap-4 p-5 bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-stone-900">View Contract</h3>
                  <p className="text-sm text-stone-500">
                    {permissions.canSignContract
                      ? 'Review and sign your photography contract'
                      : 'View your photography contract'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </Link>
            </motion.div>
          )}

          {permissions.canMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                href={`/portal/${token}/messages`}
                className="flex items-center gap-4 p-5 bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-stone-900">Messages</h3>
                  <p className="text-sm text-stone-500">Chat with your photographer</p>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </Link>
            </motion.div>
          )}

          {permissions.canViewGallery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href={`/portal/${token}/gallery`}
                className="flex items-center gap-4 p-5 bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Image className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-stone-900">Photo Gallery</h3>
                  <p className="text-sm text-stone-500">
                    {permissions.canDownload
                      ? 'View and download your photos'
                      : 'View your photos'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </Link>
            </motion.div>
          )}
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
            <a href="https://12img.com" className="hover:text-stone-600 transition-colors">
              12IMG
            </a>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
