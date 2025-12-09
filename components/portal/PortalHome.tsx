'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, MessageSquare, Image, ChevronRight, Calendar, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { type PortalData } from '@/server/actions/portal.actions'
import { EVENT_TYPE_LABELS } from '@/lib/contracts/types'

interface PortalHomeProps {
  data: PortalData
  token: string
}

export function PortalHome({ data, token }: PortalHomeProps) {
  const { client, photographerName, permissions, deliveryProgress } = data

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

        {/* Delivery Progress Card */}
        {deliveryProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <div className={`rounded-2xl border p-6 ${
              deliveryProgress.status === 'delivered' 
                ? 'bg-emerald-50 border-emerald-200' 
                : deliveryProgress.isOverdue 
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-white border-stone-200'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {deliveryProgress.status === 'delivered' ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                  ) : deliveryProgress.isOverdue ? (
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-stone-600" />
                    </div>
                  )}
                  <div>
                    <h3 className={`font-medium ${
                      deliveryProgress.status === 'delivered' 
                        ? 'text-emerald-900' 
                        : deliveryProgress.isOverdue 
                          ? 'text-amber-900'
                          : 'text-stone-900'
                    }`}>
                      {deliveryProgress.status === 'delivered' 
                        ? 'Your Gallery is Ready!' 
                        : deliveryProgress.status === 'pending_event'
                          ? 'Awaiting Your Event'
                          : deliveryProgress.isOverdue
                            ? 'Final Processing'
                            : 'Gallery In Progress'}
                    </h3>
                    <p className={`text-sm ${
                      deliveryProgress.status === 'delivered' 
                        ? 'text-emerald-700' 
                        : deliveryProgress.isOverdue 
                          ? 'text-amber-700'
                          : 'text-stone-500'
                    }`}>
                      {deliveryProgress.status === 'delivered' 
                        ? 'Your photos are ready to view and download'
                        : deliveryProgress.status === 'pending_event'
                          ? 'Countdown begins after your event'
                          : deliveryProgress.isOverdue
                            ? 'Your gallery is in final processing and will be ready soon'
                            : `${deliveryProgress.daysElapsed} days of editing complete`}
                    </p>
                  </div>
                </div>

                {/* Days counter */}
                {deliveryProgress.status !== 'delivered' && deliveryProgress.status !== 'pending_event' && (
                  <div className="text-right">
                    <p className={`text-3xl font-light tabular-nums ${
                      deliveryProgress.isOverdue ? 'text-amber-600' : 'text-stone-900'
                    }`}>
                      {Math.abs(deliveryProgress.daysRemaining || 0)}
                    </p>
                    <p className={`text-xs ${
                      deliveryProgress.isOverdue ? 'text-amber-600' : 'text-stone-500'
                    }`}>
                      {deliveryProgress.isOverdue ? 'days overdue' : 'days left'}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {deliveryProgress.status !== 'pending_event' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={deliveryProgress.status === 'delivered' ? 'text-emerald-700' : deliveryProgress.isOverdue ? 'text-amber-700' : 'text-stone-500'}>
                      Progress
                    </span>
                    <span className={deliveryProgress.status === 'delivered' ? 'text-emerald-700' : deliveryProgress.isOverdue ? 'text-amber-700' : 'text-stone-500'}>
                      {deliveryProgress.percentComplete}%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${
                    deliveryProgress.status === 'delivered' 
                      ? 'bg-emerald-200' 
                      : deliveryProgress.isOverdue 
                        ? 'bg-amber-200'
                        : 'bg-stone-200'
                  }`}>
                    <motion.div
                      className={`h-full rounded-full ${
                        deliveryProgress.status === 'delivered' 
                          ? 'bg-emerald-500' 
                          : deliveryProgress.isOverdue 
                            ? 'bg-amber-500'
                            : 'bg-stone-900'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(deliveryProgress.percentComplete, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              {/* Estimated delivery */}
              {deliveryProgress.estimatedDeliveryDate && deliveryProgress.status !== 'delivered' && (
                <div className={`pt-3 border-t ${
                  deliveryProgress.isOverdue ? 'border-amber-200' : 'border-stone-100'
                }`}>
                  <p className={`text-xs uppercase tracking-wider ${
                    deliveryProgress.isOverdue ? 'text-amber-600' : 'text-stone-400'
                  }`}>
                    Estimated Delivery
                  </p>
                  <p className={`text-sm font-medium ${
                    deliveryProgress.isOverdue ? 'text-amber-900' : 'text-stone-900'
                  }`}>
                    {new Date(deliveryProgress.estimatedDeliveryDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

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
