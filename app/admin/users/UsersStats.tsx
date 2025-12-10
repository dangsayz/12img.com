'use client'

import { motion } from 'framer-motion'
import { Users, UserPlus, TrendingUp, Ban, CreditCard } from 'lucide-react'

interface UserStats {
  total: number
  active: number
  suspended: number
  newToday: number
  newThisWeek: number
  paid: number
  planBreakdown: Record<string, number>
}

interface Props {
  stats: UserStats
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 30,
    }
  },
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="tabular-nums"
    >
      {value.toLocaleString()}{suffix}
    </motion.span>
  )
}

export function UsersStats({ stats }: Props) {
  const conversionRate = stats.total > 0 
    ? Math.round((stats.paid / stats.total) * 100) 
    : 0

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
    >
      {/* Total Users */}
      <motion.div
        variants={item}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="bg-white border border-[#E5E5E5] p-5 group cursor-default"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 bg-[#F5F5F7] flex items-center justify-center group-hover:bg-[#141414] transition-colors duration-300">
            <Users className="w-4 h-4 text-[#525252] group-hover:text-white transition-colors duration-300" />
          </div>
          {stats.newToday > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 text-xs text-emerald-600"
            >
              <TrendingUp className="w-3 h-3" />
              +{stats.newToday}
            </motion.div>
          )}
        </div>
        <p className="text-2xl font-light text-[#141414] tracking-tight">
          <AnimatedNumber value={stats.total} />
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#525252] mt-1">Total Users</p>
      </motion.div>

      {/* Active Users */}
      <motion.div
        variants={item}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="bg-white border border-[#E5E5E5] p-5 group cursor-default"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 transition-colors duration-300">
            <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:bg-white transition-colors duration-300" />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-emerald-600">
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
          </span>
        </div>
        <p className="text-2xl font-light text-[#141414] tracking-tight">
          <AnimatedNumber value={stats.active} />
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#525252] mt-1">Active</p>
      </motion.div>

      {/* Suspended */}
      <motion.div
        variants={item}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="bg-white border border-[#E5E5E5] p-5 group cursor-default"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 bg-red-50 flex items-center justify-center group-hover:bg-red-500 transition-colors duration-300">
            <Ban className="w-4 h-4 text-red-500 group-hover:text-white transition-colors duration-300" />
          </div>
        </div>
        <p className="text-2xl font-light text-[#141414] tracking-tight">
          <AnimatedNumber value={stats.suspended} />
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#525252] mt-1">Suspended</p>
      </motion.div>

      {/* New This Week */}
      <motion.div
        variants={item}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="bg-white border border-[#E5E5E5] p-5 group cursor-default"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 bg-[#F5F5F7] flex items-center justify-center group-hover:bg-[#141414] transition-colors duration-300">
            <UserPlus className="w-4 h-4 text-[#525252] group-hover:text-white transition-colors duration-300" />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[#525252]">7 days</span>
        </div>
        <p className="text-2xl font-light text-[#141414] tracking-tight">
          <AnimatedNumber value={stats.newThisWeek} />
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#525252] mt-1">New Users</p>
      </motion.div>

      {/* Paid Users */}
      <motion.div
        variants={item}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="bg-white border border-[#E5E5E5] p-5 group cursor-default"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 bg-[#F5F5F7] flex items-center justify-center group-hover:bg-[#141414] transition-colors duration-300">
            <CreditCard className="w-4 h-4 text-[#525252] group-hover:text-white transition-colors duration-300" />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[#525252]">
            {conversionRate}% conv
          </span>
        </div>
        <p className="text-2xl font-light text-[#141414] tracking-tight">
          <AnimatedNumber value={stats.paid} />
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#525252] mt-1">Paid Users</p>
      </motion.div>

      {/* Plan Breakdown Mini */}
      <motion.div
        variants={item}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="bg-white border border-[#E5E5E5] p-5 group cursor-default"
      >
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#525252]">Plan Mix</p>
        </div>
        <div className="space-y-1.5">
          {Object.entries(stats.planBreakdown)
            .filter(([_, count]) => count > 0)
            .slice(0, 4)
            .map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#F5F5F7] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / stats.total) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                    className={`h-full ${
                      plan === 'elite' ? 'bg-[#141414]' :
                      plan === 'studio' ? 'bg-[#525252]' :
                      plan === 'pro' ? 'bg-[#737373]' :
                      plan === 'starter' ? 'bg-[#A3A3A3]' :
                      'bg-[#D4D4D4]'
                    }`}
                  />
                </div>
                <span className="text-[9px] uppercase tracking-wider text-[#525252] w-12 text-right">
                  {plan}
                </span>
              </div>
            ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
