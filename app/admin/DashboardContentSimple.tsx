'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Users, Layers, HardDrive, Mail } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  totalGalleries: number
  totalImages: number
  totalStorageBytes: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  planBreakdown: Record<string, number>
}

interface RevenueMetrics {
  mrr: number
  arr: number
  revenueThisMonth: number
  activeSubscriptions: number
  conversionRate: number
  paidUsers: number
  paidUsersStripe: number
  paidUsersManual: number
  freeUsers: number
}

interface Props {
  stats: DashboardStats
  revenue: RevenueMetrics | null
}

function formatCurrency(cents: number): string {
  return `$${Math.round(cents / 100)}`
}

export function DashboardContent({ stats, revenue }: Props) {
  const mrrDollars = revenue ? Math.round(revenue.mrr / 100) : 0
  const paidUsers = revenue?.paidUsers || 0
  const freeUsers = revenue?.freeUsers || 0
  
  // Calculate next milestone
  const milestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]
  const nextMilestone = milestones.find(m => mrrDollars < m) || 100000
  const progress = Math.min(100, (mrrDollars / nextMilestone) * 100)
  
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* THE ONE NUMBER THAT MATTERS */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141414] p-8 lg:p-12 text-white text-center"
      >
        <p className="text-white/50 text-sm mb-4">You're making</p>
        <p className="text-6xl lg:text-8xl font-light tracking-tight">
          ${mrrDollars}
        </p>
        <p className="text-white/50 text-lg mt-2">per month</p>
        
        {/* Progress to next milestone */}
        <div className="mt-10 max-w-md mx-auto">
          <div className="flex justify-between text-sm text-white/40 mb-2">
            <span>${mrrDollars}</span>
            <span>${nextMilestone.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <p className="text-white/40 text-sm mt-3">
            ${nextMilestone - mrrDollars} to go
          </p>
        </div>
      </motion.div>
      
      {/* THE TWO THINGS YOU NEED TO KNOW */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-stone-200 p-6 text-center"
        >
          <p className="text-5xl font-light text-[#141414]">{paidUsers}</p>
          <p className="text-stone-500 text-sm mt-2">paying customers</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-stone-200 p-6 text-center"
        >
          <p className="text-5xl font-light text-[#141414]">{freeUsers}</p>
          <p className="text-stone-500 text-sm mt-2">free users</p>
        </motion.div>
      </div>
      
      {/* YOUR PRIORITY RIGHT NOW */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-stone-50 border border-stone-200 p-6"
      >
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-4">Your #1 priority</p>
        <p className="text-2xl text-[#141414] font-light">
          Convert {freeUsers} free users to paid
        </p>
        <p className="text-stone-500 mt-2">
          If just 1 more person upgrades, you'll be at ${mrrDollars + 16}/month
        </p>
        
        <div className="mt-6 flex gap-3">
          <Link 
            href="/admin/promos"
            className="flex-1 bg-[#141414] text-white px-4 py-3 text-center text-sm font-medium hover:bg-black transition-colors"
          >
            Create a promo
          </Link>
          <Link 
            href="/admin/emails"
            className="flex-1 border border-stone-300 px-4 py-3 text-center text-sm font-medium hover:border-[#141414] transition-colors"
          >
            Send an email
          </Link>
        </div>
      </motion.div>
      
      {/* QUICK LINKS - COLLAPSED */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-4">Quick links</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { href: '/admin/users', icon: Users, label: 'Users' },
            { href: '/admin/galleries', icon: Layers, label: 'Galleries' },
            { href: '/admin/storage', icon: HardDrive, label: 'Storage' },
            { href: '/admin/emails', icon: Mail, label: 'Emails' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 p-4 border border-stone-200 hover:border-[#141414] transition-colors text-center"
            >
              <item.icon className="w-5 h-5 text-stone-400" />
              <span className="text-xs text-stone-600">{item.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
      
    </div>
  )
}
