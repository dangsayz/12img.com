'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight,
  Check,
  Gift,
  X,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
// CUSTOM MILESTONE ICONS - Unique SVG for each milestone
// ═══════════════════════════════════════════════════════════════

function IconSeed({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22V12" strokeLinecap="round" />
      <path d="M12 12C12 12 8 10 8 6C8 2 12 2 12 2C12 2 16 2 16 6C16 10 12 12 12 12Z" />
      <path d="M8 18C6 18 4 16 4 14" strokeLinecap="round" />
      <path d="M16 18C18 18 20 16 20 14" strokeLinecap="round" />
    </svg>
  )
}

function IconFlame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22C16.4183 22 20 18.4183 20 14C20 8 12 2 12 2C12 2 4 8 4 14C4 18.4183 7.58172 22 12 22Z" />
      <path d="M12 22C14.2091 22 16 19.5 16 16C16 12 12 8 12 8C12 8 8 12 8 16C8 19.5 9.79086 22 12 22Z" />
    </svg>
  )
}

function IconRocket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z" />
      <path d="M12 22L8 18H16L12 22Z" />
      <circle cx="12" cy="10" r="2" />
      <path d="M5 15L8 12" strokeLinecap="round" />
      <path d="M19 15L16 12" strokeLinecap="round" />
    </svg>
  )
}

function IconTrophy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2H16V10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10V2Z" />
      <path d="M8 4H4C4 4 4 8 6 8C8 8 8 6 8 6" />
      <path d="M16 4H20C20 4 20 8 18 8C16 8 16 6 16 6" />
      <path d="M12 14V18" />
      <path d="M8 22H16" strokeLinecap="round" />
      <path d="M10 18H14V22H10V18Z" />
    </svg>
  )
}

function IconTarget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2V6" strokeLinecap="round" />
      <path d="M12 18V22" strokeLinecap="round" />
      <path d="M2 12H6" strokeLinecap="round" />
      <path d="M18 12H22" strokeLinecap="round" />
    </svg>
  )
}

function IconDiamond({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 9L12 22L22 9L12 2Z" />
      <path d="M2 9H22" />
      <path d="M12 2L8 9L12 22L16 9L12 2Z" />
    </svg>
  )
}

function IconCrown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M2 8L6 20H18L22 8L17 12L12 4L7 12L2 8Z" />
      <circle cx="12" cy="4" r="1" fill="currentColor" />
      <circle cx="2" cy="8" r="1" fill="currentColor" />
      <circle cx="22" cy="8" r="1" fill="currentColor" />
      <path d="M6 20V22H18V20" />
    </svg>
  )
}

function IconMountain({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 4L2 20H22L12 4Z" />
      <path d="M12 4V8" strokeLinecap="round" />
      <path d="M10 8H14" strokeLinecap="round" />
      <path d="M7 14L10 11L13 14L16 11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// YOUR ACTUAL PRICING
// ═══════════════════════════════════════════════════════════════

const PLANS = {
  starter: { monthly: 7, yearly: 59, name: 'Starter' },
  pro: { monthly: 19, yearly: 159, name: 'Pro' },
  studio: { monthly: 34, yearly: 289, name: 'Studio' },
  elite: { monthly: 54, yearly: 449, name: 'Elite' },
}

// Average revenue per user (blended monthly + annual)
// Assuming 70% annual, 30% monthly for paid users
const ARPU = {
  starter: Math.round(PLANS.starter.yearly * 0.7 / 12 + PLANS.starter.monthly * 0.3), // ~$5.5
  pro: Math.round(PLANS.pro.yearly * 0.7 / 12 + PLANS.pro.monthly * 0.3),             // ~$15
  studio: Math.round(PLANS.studio.yearly * 0.7 / 12 + PLANS.studio.monthly * 0.3),     // ~$27
  elite: Math.round(PLANS.elite.yearly * 0.7 / 12 + PLANS.elite.monthly * 0.3),       // ~$43
}

// Blended ARPU across all paid users (typical distribution)
// 40% Starter, 35% Pro, 15% Studio, 10% Elite
const BLENDED_ARPU = Math.round(
  ARPU.starter * 0.40 + 
  ARPU.pro * 0.35 + 
  ARPU.studio * 0.15 + 
  ARPU.elite * 0.10
) // ~$15/user/month

// ═══════════════════════════════════════════════════════════════
// MILESTONES TO $100K/MONTH
// ═══════════════════════════════════════════════════════════════

interface Milestone {
  target: number // MRR in dollars
  label: string
  icon: React.ElementType
  emoji: string
  message: string
  usersNeeded: number // at blended ARPU
  celebrationColor: string
  promoIdea?: string
}

const MILESTONES: Milestone[] = [
  { 
    target: 100, 
    label: '$100/month', 
    icon: IconSeed, 
    emoji: '🌱',
    message: 'First paying customers!',
    usersNeeded: Math.ceil(100 / BLENDED_ARPU),
    celebrationColor: 'from-emerald-400 to-green-500',
    promoIdea: '50% off first year',
  },
  { 
    target: 500, 
    label: '$500/month', 
    icon: IconFlame, 
    emoji: '🔥',
    message: 'Getting hot!',
    usersNeeded: Math.ceil(500 / BLENDED_ARPU),
    celebrationColor: 'from-orange-400 to-red-500',
    promoIdea: 'Referral program - give $10, get $10',
  },
  { 
    target: 1000, 
    label: '$1,000/month', 
    icon: IconRocket, 
    emoji: '🚀',
    message: 'Liftoff! 4 figures!',
    usersNeeded: Math.ceil(1000 / BLENDED_ARPU),
    celebrationColor: 'from-blue-400 to-indigo-500',
    promoIdea: 'Black Friday sale',
  },
  { 
    target: 2500, 
    label: '$2,500/month', 
    icon: IconTrophy, 
    emoji: '🏆',
    message: 'Could quit your job!',
    usersNeeded: Math.ceil(2500 / BLENDED_ARPU),
    celebrationColor: 'from-yellow-400 to-amber-500',
    promoIdea: 'Wedding season sale',
  },
  { 
    target: 5000, 
    label: '$5,000/month', 
    icon: IconTarget, 
    emoji: '🎯',
    message: 'Real business!',
    usersNeeded: Math.ceil(5000 / BLENDED_ARPU),
    celebrationColor: 'from-emerald-400 to-teal-500',
    promoIdea: 'Partner with wedding blogs',
  },
  { 
    target: 10000, 
    label: '$10,000/month', 
    icon: IconDiamond, 
    emoji: '💎',
    message: 'Life changing!',
    usersNeeded: Math.ceil(10000 / BLENDED_ARPU),
    celebrationColor: 'from-purple-400 to-pink-500',
    promoIdea: 'New Year sale',
  },
  { 
    target: 25000, 
    label: '$25,000/month', 
    icon: IconCrown, 
    emoji: '👑',
    message: 'Hire someone!',
    usersNeeded: Math.ceil(25000 / BLENDED_ARPU),
    celebrationColor: 'from-yellow-300 to-yellow-500',
    promoIdea: 'Push Studio plan',
  },
  { 
    target: 50000, 
    label: '$50,000/month', 
    icon: IconMountain, 
    emoji: '⛰️',
    message: 'Halfway there!',
    usersNeeded: Math.ceil(50000 / BLENDED_ARPU),
    celebrationColor: 'from-slate-400 to-slate-600',
    promoIdea: 'Launch agency tier',
  },
  { 
    target: 100000, 
    label: '$100,000/month', 
    icon: IconStar, 
    emoji: '⭐',
    message: 'YOU DID IT!',
    usersNeeded: Math.ceil(100000 / BLENDED_ARPU),
    celebrationColor: 'from-yellow-400 via-amber-500 to-orange-500',
    promoIdea: 'Celebrate!',
  },
]

// ═══════════════════════════════════════════════════════════════
// PROMO CALENDAR
// ═══════════════════════════════════════════════════════════════

interface PromoIdea {
  month: string
  name: string
  discount: string
  targetPlan: string
  psychology: string
  expectedLift: string
}

const PROMO_CALENDAR: PromoIdea[] = [
  {
    month: 'January',
    name: 'New Year, New Business',
    discount: '40% off annual plans',
    targetPlan: 'Pro & Studio',
    psychology: 'New year resolutions, fresh start energy',
    expectedLift: '+25% conversions',
  },
  {
    month: 'February',
    name: 'Valentine\'s Special',
    discount: '30% off + free month',
    targetPlan: 'All paid tiers',
    psychology: 'Engagement season starts, couples booking',
    expectedLift: '+20% conversions',
  },
  {
    month: 'March',
    name: 'Spring Booking Rush',
    discount: '25% off Pro tier',
    targetPlan: 'Pro',
    psychology: 'Wedding season prep, photographers booking up',
    expectedLift: '+15% conversions',
  },
  {
    month: 'April',
    name: 'Tax Season Relief',
    discount: '35% off annual (write-off!)',
    targetPlan: 'Studio & Elite',
    psychology: 'Business expense before tax deadline',
    expectedLift: '+30% conversions',
  },
  {
    month: 'May-August',
    name: 'Peak Season',
    discount: 'No discounts needed',
    targetPlan: 'Focus on retention',
    psychology: 'High demand, photographers busy',
    expectedLift: 'Natural growth',
  },
  {
    month: 'September',
    name: 'Back to Business',
    discount: '20% off + 2 months free',
    targetPlan: 'Starter & Pro',
    psychology: 'Post-summer, planning for fall weddings',
    expectedLift: '+20% conversions',
  },
  {
    month: 'October',
    name: 'Halloween Flash Sale',
    discount: '31% off (spooky!)',
    targetPlan: 'All tiers',
    psychology: 'Fun, limited time urgency',
    expectedLift: '+15% conversions',
  },
  {
    month: 'November',
    name: 'Black Friday/Cyber Monday',
    discount: '50% off first year',
    targetPlan: 'All tiers',
    psychology: 'Biggest sale of year, FOMO',
    expectedLift: '+50% conversions',
  },
  {
    month: 'December',
    name: 'Year-End Close',
    discount: '40% off + lock in 2024 prices',
    targetPlan: 'Pro & Studio',
    psychology: 'Business expense, price increase fear',
    expectedLift: '+35% conversions',
  },
]

// ═══════════════════════════════════════════════════════════════
// CELEBRATION ANIMATION - Epic milestone unlocks
// ═══════════════════════════════════════════════════════════════

// Confetti shapes
function ConfettiParticle({ delay, x, shape }: { delay: number; x: number; shape: 'square' | 'circle' | 'triangle' }) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F8B500', '#7B68EE']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const size = 4 + Math.random() * 8
  
  return (
    <motion.div
      initial={{ y: -50, x, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ 
        y: 500, 
        x: x + (Math.random() - 0.5) * 300,
        opacity: 0,
        rotate: Math.random() * 1080 - 540,
        scale: 0.5,
      }}
      transition={{ 
        duration: 2.5 + Math.random() * 1.5, 
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="absolute top-0 pointer-events-none"
      style={{ 
        width: size, 
        height: size,
        backgroundColor: shape !== 'triangle' ? color : 'transparent',
        borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '2px' : 0,
        borderLeft: shape === 'triangle' ? `${size/2}px solid transparent` : undefined,
        borderRight: shape === 'triangle' ? `${size/2}px solid transparent` : undefined,
        borderBottom: shape === 'triangle' ? `${size}px solid ${color}` : undefined,
      }}
    />
  )
}

// Pulsing ring effect
function PulseRing({ delay, color }: { delay: number; color: string }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0.8 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ 
        duration: 1.5, 
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="absolute inset-0 rounded-full border-2 pointer-events-none"
      style={{ borderColor: color }}
    />
  )
}

// Animated milestone icon
function AnimatedMilestoneIcon({ milestone }: { milestone: Milestone }) {
  const Icon = milestone.icon
  
  return (
    <div className="relative w-24 h-24 mx-auto mb-6">
      {/* Pulsing rings */}
      <PulseRing delay={0} color="#FFD700" />
      <PulseRing delay={0.2} color="#FF6B6B" />
      <PulseRing delay={0.4} color="#4ECDC4" />
      
      {/* Glowing background */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${milestone.celebrationColor} blur-xl opacity-50`}
      />
      
      {/* Icon container */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 12 }}
        className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${milestone.celebrationColor} flex items-center justify-center shadow-2xl`}
      >
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          <Icon className="w-12 h-12 text-white" />
        </motion.div>
      </motion.div>
      
      {/* Sparkle effects */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{ 
            duration: 1,
            delay: 0.5 + i * 0.15,
            repeat: Infinity,
            repeatDelay: 2,
          }}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            top: `${20 + Math.sin(i * Math.PI / 3) * 40}%`,
            left: `${50 + Math.cos(i * Math.PI / 3) * 50}%`,
            boxShadow: '0 0 10px 2px rgba(255,255,255,0.8)',
          }}
        />
      ))}
    </div>
  )
}

function CelebrationOverlay({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
  const [confetti, setConfetti] = useState<{ id: number; delay: number; x: number; shape: 'square' | 'circle' | 'triangle' }[]>([])
  
  useEffect(() => {
    const shapes: ('square' | 'circle' | 'triangle')[] = ['square', 'circle', 'triangle']
    const particles = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      delay: Math.random() * 0.8,
      x: Math.random() * 600 - 300,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }))
    setConfetti(particles)
    
    const timer = setTimeout(onClose, 6000)
    return () => clearTimeout(timer)
  }, [onClose])
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Confetti container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          {confetti.map((p) => (
            <ConfettiParticle key={p.id} delay={p.delay} x={p.x} shape={p.shape} />
          ))}
        </div>
      </div>
      
      {/* Main card */}
      <motion.div
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white p-12 text-center relative overflow-hidden max-w-lg mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient border effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${milestone.celebrationColor} opacity-10`} />
        <div className="absolute inset-[1px] bg-white" />
        
        {/* Content */}
        <div className="relative">
          <button 
            onClick={onClose}
            className="absolute -top-6 -right-6 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* Animated icon */}
          <AnimatedMilestoneIcon milestone={milestone} />
          
          {/* Emoji burst */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="text-6xl mb-4"
          >
            {milestone.emoji}
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-2"
          >
            Milestone Unlocked
          </motion.p>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`text-4xl font-bold bg-gradient-to-r ${milestone.celebrationColor} bg-clip-text text-transparent mb-4`}
          >
            {milestone.label}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg text-stone-600 mb-6"
          >
            {milestone.message}
          </motion.p>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-8 pt-6 border-t border-stone-100"
          >
            <div className="text-center">
              <p className="text-2xl font-light text-[#141414] tabular-nums">${milestone.target.toLocaleString()}</p>
              <p className="text-xs text-stone-400 uppercase tracking-wider">MRR</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light text-[#141414] tabular-nums">${(milestone.target * 12).toLocaleString()}</p>
              <p className="text-xs text-stone-400 uppercase tracking-wider">ARR</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light text-[#141414] tabular-nums">{milestone.usersNeeded.toLocaleString()}</p>
              <p className="text-xs text-stone-400 uppercase tracking-wider">Users</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface Props {
  currentMRR: number // in cents
}

export function RevenueRoadmap({ currentMRR }: Props) {
  const [showCelebration, setShowCelebration] = useState<Milestone | null>(null)
  const [activeTab, setActiveTab] = useState<'milestones' | 'promos'>('milestones')
  
  const mrrDollars = currentMRR / 100
  
  // Find current milestone
  const currentMilestoneIndex = MILESTONES.findIndex(m => mrrDollars < m.target)
  const nextMilestone = MILESTONES[currentMilestoneIndex] || MILESTONES[MILESTONES.length - 1]
  const prevMilestone = MILESTONES[currentMilestoneIndex - 1]
  
  // Calculate progress to next milestone
  const progressStart = prevMilestone?.target || 0
  const progressEnd = nextMilestone.target
  const progressPercent = Math.min(100, Math.max(0, 
    ((mrrDollars - progressStart) / (progressEnd - progressStart)) * 100
  ))
  
  // Demo celebration (click milestone to celebrate)
  const handleMilestoneClick = useCallback((milestone: Milestone) => {
    if (mrrDollars >= milestone.target) {
      setShowCelebration(milestone)
    }
  }, [mrrDollars])
  
  const formatMRR = (amount: number) => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`
    return `$${amount}`
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay 
            milestone={showCelebration} 
            onClose={() => setShowCelebration(null)} 
          />
        )}
      </AnimatePresence>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[#141414]">Road to $100K/month</h2>
          <p className="text-sm text-stone-500 mt-1">
            Currently at {formatMRR(mrrDollars)}/month
          </p>
        </div>
        <div className="px-3 py-1.5 bg-[#141414] text-white">
          <span className="text-xs font-medium uppercase tracking-wider">Your Goal</span>
        </div>
      </div>
      
      {/* Current Progress Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#141414] to-[#2a2a2a] p-6 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Next Milestone</p>
            <div className="flex items-center gap-4">
              <span className="text-5xl">{nextMilestone.emoji}</span>
              <div>
                <p className="text-3xl font-light">{nextMilestone.label}</p>
                <p className="text-white/60 text-sm mt-1">{nextMilestone.message}</p>
              </div>
            </div>
          </div>
          
          <div className="lg:text-right">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">To Get There</p>
            <p className="text-4xl font-light tabular-nums">
              {nextMilestone.usersNeeded.toLocaleString()}
            </p>
            <p className="text-white/40 text-sm mt-1">
              paying customers
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative mt-8">
          <div className="flex justify-between text-xs text-white/40 mb-2">
            <span>{formatMRR(progressStart)}</span>
            <span>{formatMRR(progressEnd)}</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full bg-gradient-to-r ${nextMilestone.celebrationColor} rounded-full relative`}
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30"
              />
            </motion.div>
          </div>
          <p className="text-center text-white/60 text-sm mt-3">
            {formatMRR(mrrDollars)} of {formatMRR(progressEnd)}
          </p>
        </div>
      </motion.div>
      
      {/* Tabs - just 2 simple options */}
      <div className="flex gap-1 p-1 bg-stone-100">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'milestones' 
              ? 'bg-white text-[#141414] shadow-sm' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Milestones
        </button>
        <button
          onClick={() => setActiveTab('promos')}
          className={`flex-1 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'promos' 
              ? 'bg-white text-[#141414] shadow-sm' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Promo Ideas
        </button>
      </div>
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'milestones' && (
          <motion.div
            key="milestones"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {MILESTONES.map((milestone, index) => {
              const isCompleted = mrrDollars >= milestone.target
              const isCurrent = index === currentMilestoneIndex
              const Icon = milestone.icon
              
              return (
                <motion.div
                  key={milestone.target}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleMilestoneClick(milestone)}
                  className={`relative p-4 border transition-all cursor-pointer ${
                    isCompleted 
                      ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400' 
                      : isCurrent
                        ? 'bg-white border-[#141414] shadow-lg'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Status indicator */}
                    <div className={`w-10 h-10 flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : isCurrent
                          ? `bg-gradient-to-br ${milestone.celebrationColor} text-white`
                          : 'bg-stone-100 text-stone-400'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{milestone.emoji}</span>
                        <span className={`font-medium ${isCompleted ? 'text-emerald-700' : 'text-[#141414]'}`}>
                          {milestone.label}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-[#141414] text-white text-[10px] uppercase tracking-wider">
                            Next
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-500 mt-0.5">{milestone.message}</p>
                    </div>
                    
                    {/* Arrow */}
                    <ChevronRight className={`w-5 h-5 ${isCompleted ? 'text-emerald-400' : 'text-stone-300'}`} />
                  </div>
                  
                  {/* Promo suggestion */}
                  {milestone.promoIdea && isCurrent && (
                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2 text-sm">
                      <Gift className="w-4 h-4 text-purple-500" />
                      <span className="text-stone-500">Suggested promo:</span>
                      <span className="text-purple-600 font-medium">{milestone.promoIdea}</span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
        
        {activeTab === 'promos' && (
          <motion.div
            key="promos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <p className="text-sm text-stone-500 mb-4">
              When to run sales throughout the year.
            </p>
            
            {PROMO_CALENDAR.map((promo, index) => (
              <motion.div
                key={promo.month}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-white border border-stone-200 hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-stone-100 text-[10px] uppercase tracking-wider font-medium text-stone-600">
                        {promo.month}
                      </span>
                      <span className="font-medium text-[#141414]">{promo.name}</span>
                    </div>
                    
                    <p className="text-emerald-600 font-medium">{promo.discount}</p>
                    <p className="text-sm text-stone-500 mt-2">"{promo.psychology}"</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
