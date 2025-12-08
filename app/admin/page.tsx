import Link from 'next/link'
import { getDashboardStats } from '@/server/admin/users'
import { getRevenueMetrics } from '@/server/admin/billing'
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
  Check,
} from 'lucide-react'

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

function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; label: string }
}) {
  return (
    <div className="bg-white border border-[#E5E5E5] p-4 lg:p-6 hover:border-[#141414] active:bg-[#F5F5F7] transition-colors duration-300">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs lg:text-sm text-[#525252]">{title}</p>
          <p className="mt-1 lg:mt-2 text-2xl lg:text-3xl font-serif text-[#141414]">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-[#525252]">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 lg:mt-3 flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-600 font-medium">+{trend.value}</span>
              <span className="text-[#525252]">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="p-1.5 lg:p-2 border border-[#E5E5E5] flex-shrink-0">
          <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-[#525252]" />
        </div>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const [stats, revenue] = await Promise.all([
    getDashboardStats(),
    getRevenueMetrics().catch(() => null), // Don't fail if Stripe is not configured
  ])
  
  return (
    <div className="space-y-4 lg:space-y-8 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl lg:text-4xl text-[#141414]">Dashboard</h1>
        <p className="text-[#525252] text-sm lg:text-base mt-1 lg:mt-2">
          Platform overview and key metrics
        </p>
      </div>
      
      {/* Revenue Hero Cards */}
      {revenue && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* MRR Card */}
          <div className="lg:col-span-2 bg-[#141414] p-5 lg:p-8 text-white rounded-xl lg:rounded-none">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2 lg:px-3 py-1 border border-white/20 text-[10px] lg:text-xs font-medium uppercase tracking-wider mb-3 lg:mb-4">
                  Monthly Recurring Revenue
                </span>
                <p className="text-3xl lg:text-5xl font-serif">{formatCurrency(revenue.mrr)}</p>
                <p className="mt-1 lg:mt-2 text-white/60 text-xs lg:text-sm">
                  {formatCurrency(revenue.arr)} ARR
                </p>
              </div>
              <div className="p-2 lg:p-3 border border-white/20">
                <Zap className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
            </div>
            <div className="mt-5 lg:mt-8 pt-4 lg:pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-6 lg:gap-8">
                <div>
                  <p className="text-white/50 text-[10px] lg:text-xs uppercase tracking-wider">This Month</p>
                  <p className="text-xl lg:text-2xl font-serif mt-1">{formatCurrency(revenue.revenueThisMonth)}</p>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] lg:text-xs uppercase tracking-wider">Active Subs</p>
                  <p className="text-xl lg:text-2xl font-serif mt-1">{revenue.activeSubscriptions}</p>
                </div>
              </div>
              <Link 
                href="/admin/billing"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 lg:py-2 bg-white text-[#141414] text-sm font-medium hover:bg-white/90 active:bg-white/80 transition-colors rounded-lg lg:rounded-none w-full sm:w-auto"
              >
                View Details
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          {/* Conversion Card */}
          <div className="bg-white border border-[#E5E5E5] p-5 lg:p-8 rounded-xl lg:rounded-none">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2 lg:px-3 py-1 border border-[#141414] text-[10px] lg:text-xs font-medium uppercase tracking-wider mb-3 lg:mb-4 text-[#141414]">
                  Conversion
                </span>
                <p className="text-3xl lg:text-5xl font-serif text-[#141414]">{revenue.conversionRate}%</p>
                <p className="mt-1 lg:mt-2 text-[#525252] text-xs lg:text-sm">Free → Paid</p>
              </div>
              <div className="p-2 lg:p-3 border border-[#E5E5E5]">
                <ArrowUpRight className="w-5 h-5 lg:w-6 lg:h-6 text-[#525252]" />
              </div>
            </div>
            <div className="mt-5 lg:mt-8 pt-4 lg:pt-6 border-t border-[#E5E5E5] grid grid-cols-2 gap-4 lg:gap-6">
              <div>
                <p className="text-[#525252] text-[10px] lg:text-xs uppercase tracking-wider">Paid</p>
                <p className="text-xl lg:text-2xl font-serif text-[#141414] mt-1">{revenue.paidUsers}</p>
              </div>
              <div>
                <p className="text-[#525252] text-[10px] lg:text-xs uppercase tracking-wider">Free</p>
                <p className="text-xl lg:text-2xl font-serif text-[#141414] mt-1">{revenue.freeUsers}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={{ value: stats.newUsersThisWeek, label: 'this week' }}
        />
        <StatCard
          title="Total Galleries"
          value={stats.totalGalleries.toLocaleString()}
          icon={Image}
        />
        <StatCard
          title="Total Images"
          value={stats.totalImages.toLocaleString()}
          icon={Image}
        />
        <StatCard
          title="Storage Used"
          value={formatBytes(stats.totalStorageBytes)}
          icon={HardDrive}
        />
      </div>
      
      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-3 lg:gap-6">
        <StatCard
          title="New Users Today"
          value={stats.newUsersToday}
          icon={UserPlus}
        />
        <StatCard
          title="New Users (30d)"
          value={stats.newUsersThisMonth}
          icon={TrendingUp}
        />
        <StatCard
          title="Suspended Users"
          value={stats.suspendedUsers}
          icon={AlertTriangle}
        />
      </div>
      
      {/* Plan Breakdown */}
      <div className="bg-white border border-[#E5E5E5] p-4 lg:p-8 rounded-xl lg:rounded-none">
        <h2 className="font-serif text-lg lg:text-2xl text-[#141414] mb-4 lg:mb-6">Plan Distribution</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 lg:gap-4">
          {Object.entries(stats.planBreakdown).map(([plan, count]) => (
            <div key={plan} className="text-center p-3 lg:p-4 border border-[#E5E5E5] hover:border-[#141414] active:bg-[#F5F5F7] transition-colors rounded-lg lg:rounded-none">
              <p className="text-xl lg:text-3xl font-serif text-[#141414]">{count}</p>
              <p className="text-[10px] lg:text-xs text-[#525252] uppercase tracking-wider mt-1 lg:mt-2">{plan}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white border border-[#E5E5E5] p-4 lg:p-8 rounded-xl lg:rounded-none">
        <h2 className="font-serif text-lg lg:text-2xl text-[#141414] mb-4 lg:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          <Link 
            href="/admin/users"
            className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#F5F5F7] active:bg-[#E5E5E5] transition-colors rounded-lg lg:rounded-none"
          >
            <Users className="w-4 h-4 lg:w-5 lg:h-5 text-[#141414] flex-shrink-0" />
            <span className="text-xs lg:text-sm font-medium text-[#141414]">Users</span>
          </Link>
          <Link 
            href="/admin/emails"
            className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#F5F5F7] active:bg-[#E5E5E5] transition-colors rounded-lg lg:rounded-none"
          >
            <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-[#141414] flex-shrink-0" />
            <span className="text-xs lg:text-sm font-medium text-[#141414]">Emails</span>
          </Link>
          <Link 
            href="/admin/logs"
            className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#F5F5F7] active:bg-[#E5E5E5] transition-colors rounded-lg lg:rounded-none"
          >
            <ScrollText className="w-4 h-4 lg:w-5 lg:h-5 text-[#141414] flex-shrink-0" />
            <span className="text-xs lg:text-sm font-medium text-[#141414]">Logs</span>
          </Link>
          <Link 
            href="/admin/flags"
            className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#F5F5F7] active:bg-[#E5E5E5] transition-colors rounded-lg lg:rounded-none"
          >
            <Flag className="w-4 h-4 lg:w-5 lg:h-5 text-[#141414] flex-shrink-0" />
            <span className="text-xs lg:text-sm font-medium text-[#141414]">Flags</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
