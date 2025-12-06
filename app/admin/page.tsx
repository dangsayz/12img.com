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
  DollarSign,
  Zap,
  ArrowUpRight,
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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-600 font-medium">+{trend.value}</span>
              <span className="text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          <Icon className="w-5 h-5 text-gray-400" />
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform overview and key metrics
        </p>
      </div>
      
      {/* Revenue Hero Cards */}
      {revenue && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Monthly Recurring Revenue</p>
                <p className="mt-2 text-4xl font-bold">{formatCurrency(revenue.mrr)}</p>
                <p className="mt-1 text-emerald-200 text-sm">
                  {formatCurrency(revenue.arr)} ARR
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-400/30 flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <p className="text-emerald-200 text-xs">This Month</p>
                  <p className="text-xl font-semibold">{formatCurrency(revenue.revenueThisMonth)}</p>
                </div>
                <div>
                  <p className="text-emerald-200 text-xs">Active Subs</p>
                  <p className="text-xl font-semibold">{revenue.activeSubscriptions}</p>
                </div>
              </div>
              <Link 
                href="/admin/billing"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                View Details
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Conversion</p>
                <p className="mt-2 text-4xl font-bold">{revenue.conversionRate}%</p>
                <p className="mt-1 text-blue-200 text-sm">Free → Paid</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-blue-400/30 grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-200 text-xs">Paid</p>
                <p className="text-xl font-semibold">{revenue.paidUsers}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Free</p>
                <p className="text-xl font-semibold">{revenue.freeUsers}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Object.entries(stats.planBreakdown).map(([plan, count]) => (
            <div key={plan} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-semibold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 capitalize">{plan}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a 
            href="/admin/users"
            className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Manage Users</span>
          </a>
          <a 
            href="/admin/emails"
            className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Send Email</span>
          </a>
          <a 
            href="/admin/logs"
            className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">View Logs</span>
          </a>
          <a 
            href="/admin/flags"
            className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Feature Flags</span>
          </a>
        </div>
      </div>
    </div>
  )
}
