'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Camera, Lock, EyeOff, Ghost, ArrowRight, Home, Users } from 'lucide-react'

export default function ProfileNotFound() {
  return <ProfileUnavailable reason="not_found" />
}

interface ProfileUnavailableProps {
  reason?: 'not_found' | 'private' | 'locked'
  photographerName?: string
}

// Fixed positions for background orbs to avoid hydration mismatch
const orbConfigs = [
  { width: 280, height: 320, left: 10, top: 15, duration: 10, xOffset: 20 },
  { width: 200, height: 240, left: 75, top: 60, duration: 12, xOffset: -15 },
  { width: 160, height: 180, left: 40, top: 80, duration: 9, xOffset: 25 },
  { width: 320, height: 280, left: 85, top: 25, duration: 11, xOffset: -20 },
  { width: 140, height: 160, left: 20, top: 50, duration: 8, xOffset: 15 },
  { width: 240, height: 200, left: 60, top: 5, duration: 13, xOffset: -10 },
]

export function ProfileUnavailable({ reason = 'not_found', photographerName }: ProfileUnavailableProps) {
  const config = {
    not_found: {
      icon: Ghost,
      title: "This profile doesn't exist",
      subtitle: "The photographer you're looking for may have moved or never existed.",
      gradient: 'from-stone-200 via-stone-100 to-stone-50',
      iconBg: 'bg-stone-100',
      iconColor: 'text-stone-400',
    },
    private: {
      icon: EyeOff,
      title: "This profile is private",
      subtitle: photographerName 
        ? `${photographerName} has chosen to keep their portfolio private.`
        : "This photographer has chosen to keep their portfolio private.",
      gradient: 'from-stone-200/60 via-stone-100 to-stone-50',
      iconBg: 'bg-stone-100',
      iconColor: 'text-stone-500',
    },
    locked: {
      icon: Lock,
      title: "This profile is protected",
      subtitle: "You'll need a PIN to view this portfolio. Contact the photographer for access.",
      gradient: 'from-stone-300/40 via-stone-100 to-stone-50',
      iconBg: 'bg-stone-100',
      iconColor: 'text-stone-600',
    },
  }

  const { icon: Icon, title, subtitle, gradient, iconBg, iconColor } = config[reason]

  return (
    <div className={`min-h-screen bg-gradient-to-b ${gradient} flex items-center justify-center px-4 overflow-hidden`}>
      {/* Animated background elements - using fixed positions */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {orbConfigs.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-stone-200/20"
            style={{
              width: orb.width,
              height: orb.height,
              left: `${orb.left}%`,
              top: `${orb.top}%`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.1, 0.25, 0.1],
              scale: [1, 1.15, 1],
              x: [0, orb.xOffset, 0],
              y: [0, orb.xOffset * 0.5, 0],
            }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* Animated icon container */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mb-8"
        >
          {/* Pulsing rings */}
          <motion.div
            className={`absolute inset-0 w-24 h-24 mx-auto rounded-full ${iconBg}`}
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className={`absolute inset-0 w-24 h-24 mx-auto rounded-full ${iconBg}`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
          />
          
          {/* Main icon circle */}
          <motion.div
            className={`relative w-24 h-24 mx-auto rounded-full ${iconBg} flex items-center justify-center shadow-lg`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <motion.div
              animate={{ 
                rotate: reason === 'locked' ? [0, -10, 10, 0] : 0,
                y: reason === 'not_found' ? [0, -5, 0] : 0,
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: 'easeInOut',
                repeatDelay: 1,
              }}
            >
              <Icon className={`w-10 h-10 ${iconColor}`} strokeWidth={1.5} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl md:text-3xl font-bold text-stone-900 mb-3 tracking-tight"
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-stone-500 text-base md:text-lg mb-10 leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/profiles"
            className="group relative px-6 py-3 bg-stone-900 text-white rounded-full text-sm font-medium overflow-hidden transition-all hover:shadow-lg hover:shadow-stone-900/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Browse Photographers
              <motion.span
                className="inline-block"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </span>
            <motion.div
              className="absolute inset-0 bg-stone-800"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </Link>
          
          <Link
            href="/"
            className="group px-6 py-3 border border-stone-200 text-stone-600 rounded-full text-sm font-medium hover:bg-stone-50 hover:border-stone-300 transition-all flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </motion.div>

        {/* Decorative camera aperture */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 mx-auto opacity-10"
          >
            <Camera className="w-full h-full text-stone-400" strokeWidth={1} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
