'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Users, 
  Image, 
  HardDrive, 
  TrendingUp,
  UserPlus,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  Mail,
  ScrollText,
  Flag,
  Activity,
  BarChart3,
  Layers,
  Database,
} from 'lucide-react'

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
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

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    }
  },
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

// Animated number component
function AnimatedValue({ value, prefix = '', suffix = '' }: { value: number | string; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="tabular-nums"
    >
      {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
    </motion.span>
  )
}

// Stat card with animations
function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
  index = 0,
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; label: string }
  index?: number
}) {
  return (
    <motion.div 
      variants={item}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-white border border-[#E5E5E5] p-5 group cursor-default hover:border-[#141414] transition-colors duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#737373]">{title}</p>
          <p className="mt-2 text-2xl lg:text-3xl font-light text-[#141414] tracking-tight">
            <AnimatedValue value={value} />
          </p>
          {subtitle && (
            <p className="mt-1 text-[10px] text-[#737373]">{subtitle}</p>
          )}
          {trend && trend.value > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="mt-3 flex items-center gap-1.5"
            >
              <div className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">+{trend.value}</span>
              </div>
              <span className="text-[10px] text-[#737373]">{trend.label}</span>
            </motion.div>
          )}
        </div>
        <div className="w-10 h-10 bg-[#F5F5F7] flex items-center justify-center group-hover:bg-[#141414] transition-colors duration-300">
          <Icon className="w-4 h-4 text-[#525252] group-hover:text-white transition-colors duration-300" />
        </div>
      </div>
    </motion.div>
  )
}

// Quick action link with hover animation
function QuickActionLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <motion.div variants={item}>
      <Link 
        href={href}
        className="flex items-center gap-3 p-4 border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#141414] group transition-all duration-200"
      >
        <div className="w-8 h-8 bg-[#F5F5F7] flex items-center justify-center group-hover:bg-white/10 transition-colors duration-200">
          <Icon className="w-4 h-4 text-[#525252] group-hover:text-white transition-colors duration-200" />
        </div>
        <span className="text-sm font-medium text-[#141414] group-hover:text-white transition-colors duration-200">{label}</span>
        <ArrowUpRight className="w-4 h-4 ml-auto text-[#737373] group-hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
      </Link>
    </motion.div>
  )
}

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

export function DashboardContent({ stats, revenue }: Props) {
  const totalPlanUsers = Object.values(stats.planBreakdown).reduce((a, b) => a + b, 0)
  
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl text-[#141414] tracking-tight">Dashboard</h1>
          <p className="text-[#737373] mt-1 text-sm">
            Platform overview and key metrics
          </p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-700 font-medium">Live</span>
        </motion.div>
      </motion.div>
      
      {/* Revenue Hero Cards */}
      {revenue && (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* MRR Card */}
          <motion.div 
            variants={fadeIn}
            whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
            className="lg:col-span-2 bg-[#141414] p-6 lg:p-8 text-white relative overflow-hidden"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <div className="relative flex items-start justify-between">
              <div>
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-3 py-1 border border-white/20 text-[10px] font-medium uppercase tracking-[0.2em] mb-4"
                >
                  Monthly Recurring Revenue
                </motion.span>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
                  className="text-4xl lg:text-6xl font-light tracking-tight"
                >
                  {formatCurrency(revenue.mrr)}
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-2 text-white/50 text-sm"
                >
                  {formatCurrency(revenue.arr)} ARR
                </motion.p>
              </div>
              <motion.div 
                initial={{ opacity: 0, rotate: -10 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.3 }}
                className="p-3 border border-white/20"
              >
                <Zap className="w-6 h-6" />
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex gap-8">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">This Month</p>
                  <p className="text-2xl font-light mt-1 tabular-nums">{formatCurrency(revenue.revenueThisMonth)}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Active Subs</p>
                  <p className="text-2xl font-light mt-1 tabular-nums">{revenue.activeSubscriptions}</p>
                </div>
              </div>
              <Link 
                href="/admin/billing"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-[#141414] text-sm font-medium hover:bg-white/90 transition-colors w-full sm:w-auto group"
              >
                View Details
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Conversion Card */}
          <motion.div 
            variants={fadeIn}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="bg-white border border-[#E5E5E5] p-6 lg:p-8 hover:border-[#141414] transition-colors duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-3 py-1 border border-[#141414] text-[10px] font-medium uppercase tracking-[0.2em] mb-4 text-[#141414]">
                  Conversion
                </span>
                <motion.p 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 25 }}
                  className="text-4xl lg:text-6xl font-light text-[#141414] tracking-tight"
                >
                  {revenue.conversionRate}%
                </motion.p>
                <p className="mt-2 text-[#737373] text-sm">Free → Paid</p>
              </div>
              <div className="p-3 border border-[#E5E5E5]">
                <ArrowUpRight className="w-6 h-6 text-[#525252]" />
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-[#E5E5E5]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[#737373] text-[10px] uppercase tracking-[0.2em]">Paid</p>
                  <p className="text-2xl font-light text-[#141414] mt-1 tabular-nums">{revenue.paidUsers}</p>
                  {revenue.paidUsersManual > 0 && (
                    <p className="text-[9px] text-amber-600 mt-0.5">
                      {revenue.paidUsersStripe} Stripe · {revenue.paidUsersManual} comp
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[#737373] text-[10px] uppercase tracking-[0.2em]">Free</p>
                  <p className="text-2xl font-light text-[#141414] mt-1 tabular-nums">{revenue.freeUsers}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Primary Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend={stats.newUsersThisWeek > 0 ? { value: stats.newUsersThisWeek, label: 'this week' } : undefined}
          index={0}
        />
        <StatCard
          title="Total Galleries"
          value={stats.totalGalleries}
          icon={Layers}
          index={1}
        />
        <StatCard
          title="Total Images"
          value={stats.totalImages}
          icon={Image}
          index={2}
        />
        <StatCard
          title="Storage Used"
          value={formatBytes(stats.totalStorageBytes)}
          icon={Database}
          index={3}
        />
      </motion.div>
      
      {/* Secondary Stats */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-4"
      >
        <StatCard
          title="New Today"
          value={stats.newUsersToday}
          icon={UserPlus}
          index={0}
        />
        <StatCard
          title="New (30 days)"
          value={stats.newUsersThisMonth}
          icon={TrendingUp}
          index={1}
        />
        <StatCard
          title="Suspended"
          value={stats.suspendedUsers}
          icon={AlertTriangle}
          index={2}
        />
      </motion.div>
      
      {/* Plan Distribution */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-[#E5E5E5] p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl text-[#141414]">Plan Distribution</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#737373] mt-1">
              {totalPlanUsers} total users across all plans
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-[#737373]" />
        </div>
        
        {/* Visual bar chart */}
        <div className="space-y-3 mb-6">
          {Object.entries(stats.planBreakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([plan, count], index) => {
              const percentage = totalPlanUsers > 0 ? (count / totalPlanUsers) * 100 : 0
              return (
                <motion.div 
                  key={plan}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#737373] w-16">{plan}</span>
                  <div className="flex-1 h-8 bg-[#F5F5F7] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.6 + index * 0.05 }}
                      className={`h-full flex items-center justify-end px-3 ${
                        plan === 'elite' ? 'bg-[#141414]' :
                        plan === 'studio' ? 'bg-[#525252]' :
                        plan === 'pro' ? 'bg-[#737373]' :
                        plan === 'starter' ? 'bg-[#A3A3A3]' :
                        'bg-[#D4D4D4]'
                      }`}
                    >
                      {percentage > 10 && (
                        <span className={`text-[10px] font-medium ${plan === 'free' || plan === 'starter' ? 'text-[#525252]' : 'text-white'}`}>
                          {count}
                        </span>
                      )}
                    </motion.div>
                  </div>
                  <span className="text-sm font-medium text-[#141414] w-12 text-right tabular-nums">{count}</span>
                </motion.div>
              )
            })}
        </div>
        
        {/* Plan cards */}
        <div className="grid grid-cols-5 gap-3 pt-4 border-t border-[#E5E5E5]">
          {['free', 'starter', 'pro', 'studio', 'elite'].map((plan, index) => {
            const count = stats.planBreakdown[plan] || 0
            const percentage = totalPlanUsers > 0 ? Math.round((count / totalPlanUsers) * 100) : 0
            return (
              <motion.div 
                key={plan}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className={`text-center p-4 border transition-colors duration-200 cursor-default ${
                  plan === 'elite' || plan === 'studio' 
                    ? 'border-[#141414] bg-[#141414] text-white' 
                    : 'border-[#E5E5E5] hover:border-[#141414]'
                }`}
              >
                <p className={`text-2xl font-light tabular-nums ${plan === 'elite' || plan === 'studio' ? 'text-white' : 'text-[#141414]'}`}>
                  {count}
                </p>
                <p className={`text-[9px] uppercase tracking-[0.2em] mt-1 ${plan === 'elite' || plan === 'studio' ? 'text-white/60' : 'text-[#737373]'}`}>
                  {plan}
                </p>
                <p className={`text-[10px] mt-1 ${plan === 'elite' || plan === 'studio' ? 'text-white/40' : 'text-[#A3A3A3]'}`}>
                  {percentage}%
                </p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
      
      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white border border-[#E5E5E5] p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl text-[#141414]">Quick Actions</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#737373] mt-1">
              Navigate to key admin sections
            </p>
          </div>
          <Activity className="w-5 h-5 text-[#737373]" />
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <QuickActionLink href="/admin/users" icon={Users} label="Manage Users" />
          <QuickActionLink href="/admin/emails" icon={Mail} label="Email Activity" />
          <QuickActionLink href="/admin/galleries" icon={Layers} label="Galleries" />
          <QuickActionLink href="/admin/storage" icon={Database} label="Storage" />
          <QuickActionLink href="/admin/billing" icon={Zap} label="Billing" />
          <QuickActionLink href="/admin/flags" icon={Flag} label="Feature Flags" />
          <QuickActionLink href="/admin/logs" icon={ScrollText} label="Audit Logs" />
          <QuickActionLink href="/admin/settings" icon={Activity} label="Settings" />
        </motion.div>
      </motion.div>
    </div>
  )
}
