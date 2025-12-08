'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Star, Heart, PartyPopper, Baby, Users, Briefcase, Camera } from 'lucide-react'
import type { EventType } from '@/types/database'

interface EventCountdownProps {
  eventDate: Date
  eventType?: EventType
  variant?: 'default' | 'compact'
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calculateTimeLeft(eventDate: Date): TimeLeft {
  const now = new Date()
  const difference = eventDate.getTime() - now.getTime()
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  }
}

function getUrgencyLevel(days: number): 'relaxed' | 'approaching' | 'soon' | 'imminent' | 'today' {
  if (days === 0) return 'today'
  if (days <= 3) return 'imminent'
  if (days <= 14) return 'soon'
  if (days <= 30) return 'approaching'
  return 'relaxed'
}

const urgencyConfig = {
  relaxed: {
    gradient: 'from-stone-50 to-white',
    ring: 'from-stone-400 to-stone-300',
    accent: 'text-stone-600',
    glow: '',
    message: 'Plenty of time',
  },
  approaching: {
    gradient: 'from-stone-50 to-white',
    ring: 'from-stone-500 to-stone-400',
    accent: 'text-stone-700',
    glow: '',
    message: 'Coming up',
  },
  soon: {
    gradient: 'from-stone-100 to-stone-50',
    ring: 'from-stone-600 to-stone-500',
    accent: 'text-stone-800',
    glow: '',
    message: 'Getting close',
  },
  imminent: {
    gradient: 'from-rose-50 to-white',
    ring: 'from-rose-400 to-rose-300',
    accent: 'text-rose-600',
    glow: '',
    message: 'Almost here',
  },
  today: {
    gradient: 'from-emerald-50 to-white',
    ring: 'from-emerald-500 to-emerald-400',
    accent: 'text-emerald-600',
    glow: '',
    message: "It's today!",
  },
}

const eventIcons: Record<EventType, typeof Heart> = {
  wedding: Heart,
  engagement: Heart,
  portrait: Camera,
  family: Users,
  newborn: Baby,
  maternity: Baby,
  corporate: Briefcase,
  event: PartyPopper,
  other: Calendar,
}

function CountdownUnit({ 
  value, 
  label, 
  urgency 
}: { 
  value: number
  label: string
  urgency: keyof typeof urgencyConfig 
}) {
  const config = urgencyConfig[urgency]
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Background ring */}
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${config.gradient} opacity-60`} />
        
        {/* Value */}
        <motion.div
          key={value}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative px-3 py-2 min-w-[3.5rem]"
        >
          <span className={`text-2xl sm:text-3xl font-light tabular-nums ${config.accent}`}>
            {String(value).padStart(2, '0')}
          </span>
        </motion.div>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-stone-400 mt-1.5 font-medium">
        {label}
      </span>
    </div>
  )
}

function CircularProgress({ 
  progress, 
  size = 120, 
  strokeWidth = 4,
  urgency,
  children 
}: { 
  progress: number
  size?: number
  strokeWidth?: number
  urgency: keyof typeof urgencyConfig
  children: React.ReactNode
}) {
  const config = urgencyConfig[urgency]
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-stone-100"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className={config.ring.split(' ')[0].replace('from-', 'stop-')} stopColor="currentColor" />
            <stop offset="100%" className={config.ring.split(' ')[1].replace('to-', 'stop-')} stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

export function EventCountdown({ 
  eventDate, 
  eventType = 'event',
  variant = 'default',
  className = '' 
}: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(eventDate))
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(eventDate))
    }, 1000)
    
    return () => clearInterval(timer)
  }, [eventDate])
  
  const urgency = useMemo(() => getUrgencyLevel(timeLeft.days), [timeLeft.days])
  const config = urgencyConfig[urgency]
  const Icon = eventIcons[eventType]
  
  // Calculate progress (assuming max 365 days countdown)
  const maxDays = 365
  const progress = Math.max(0, Math.min(100, ((maxDays - timeLeft.days) / maxDays) * 100))
  
  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-32 bg-stone-100 rounded-2xl" />
      </div>
    )
  }
  
  // Event has passed
  if (timeLeft.total <= 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 ${className}`}
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
          <PartyPopper className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-700">Event Complete!</p>
          <p className="text-xs text-emerald-600/70">
            {eventDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </motion.div>
    )
  }
  
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-4 ${className}`}
      >
        <div className="text-right">
          <div className="flex items-baseline gap-1.5">
            <motion.span 
              key={timeLeft.days}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`text-4xl font-extralight tabular-nums ${config.accent}`}
            >
              {timeLeft.days}
            </motion.span>
            <span className="text-sm text-stone-400 font-medium">days</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} border border-stone-200/50 flex items-center justify-center shadow-sm ${config.glow}`}>
          <Icon className={`w-5 h-5 ${config.accent}`} />
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} border border-stone-200/50 shadow-sm ${config.glow} ${className}`}
    >
      {/* Subtle animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white to-transparent rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
      </div>
      
      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm`}>
              <Icon className={`w-4 h-4 ${config.accent}`} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-400 font-medium">Event Countdown</p>
              <p className={`text-xs font-medium ${config.accent}`}>{config.message}</p>
            </div>
          </div>
          
          {/* Pulsing indicator for imminent events */}
          {(urgency === 'imminent' || urgency === 'today') && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.ring}`}
            />
          )}
        </div>
        
        {/* Main countdown display */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <CountdownUnit value={timeLeft.days} label="Days" urgency={urgency} />
          <span className={`text-xl font-light ${config.accent} opacity-30 self-start mt-3`}>:</span>
          <CountdownUnit value={timeLeft.hours} label="Hours" urgency={urgency} />
          <span className={`text-xl font-light ${config.accent} opacity-30 self-start mt-3`}>:</span>
          <CountdownUnit value={timeLeft.minutes} label="Mins" urgency={urgency} />
          <span className={`text-xl font-light ${config.accent} opacity-30 self-start mt-3 hidden sm:block`}>:</span>
          <div className="hidden sm:block">
            <CountdownUnit value={timeLeft.seconds} label="Secs" urgency={urgency} />
          </div>
        </div>
        
        {/* Event date footer */}
        <div className="mt-4 pt-4 border-t border-stone-200/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <p className="text-sm text-stone-500">
              {eventDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Minimal inline countdown for list views
export function InlineCountdown({ 
  eventDate, 
  className = '' 
}: { 
  eventDate: Date
  className?: string 
}) {
  const [days, setDays] = useState(() => {
    const diff = eventDate.getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })
  
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = eventDate.getTime() - Date.now()
      setDays(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))))
    }, 60000) // Update every minute
    
    return () => clearInterval(timer)
  }, [eventDate])
  
  const urgency = getUrgencyLevel(days)
  const config = urgencyConfig[urgency]
  
  if (days <= 0) {
    return (
      <span className={`text-emerald-600 font-medium ${className}`}>
        Today!
      </span>
    )
  }
  
  return (
    <span className={`${config.accent} font-medium tabular-nums ${className}`}>
      {days}d
    </span>
  )
}
