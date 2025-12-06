import Link from 'next/link'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  CreditCard,
  ArrowUpRight,
  ExternalLink,
  Zap,
} from 'lucide-react'
import { getRevenueMetrics, getRecentPayments, getStripeDashboardUrl } from '@/server/admin/billing'
import { RealtimeWrapper } from './RealtimeWrapper'

function formatCurrency(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatCurrencyDetailed(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function RevenueCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'gray',
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; positive: boolean }
  color?: 'green' | 'blue' | 'purple' | 'gray' | 'amber'
}) {
  const colorClasses = {
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {trend.positive ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={trend.positive ? 'text-emerald-600' : 'text-red-600'}>
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default async function BillingDashboardPage() {
  let metrics
  let recentPayments
  let stripeDashboardUrl
  
  try {
    [metrics, recentPayments, stripeDashboardUrl] = await Promise.all([
      getRevenueMetrics(),
      getRecentPayments(10),
      getStripeDashboardUrl(),
    ])
  } catch (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Failed to load billing data. Make sure Stripe is configured.</p>
        <p className="text-sm text-gray-500 mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
  
  const monthlyGrowth = metrics.revenuePreviousMonth > 0
    ? Math.round(((metrics.revenueThisMonth - metrics.revenuePreviousMonth) / metrics.revenuePreviousMonth) * 100)
    : 0
  
  return (
    <RealtimeWrapper refreshInterval={15}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Revenue & Billing</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time revenue metrics and payment history
            </p>
          </div>
          <a
            href={stripeDashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Stripe Dashboard
        </a>
      </div>
      
      {/* Hero Revenue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Monthly Recurring Revenue</p>
              <p className="mt-2 text-4xl font-bold">{formatCurrency(metrics.mrr)}</p>
              <p className="mt-1 text-emerald-200 text-sm">
                {formatCurrency(metrics.arr)} ARR
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-emerald-400/30 grid grid-cols-3 gap-4">
            <div>
              <p className="text-emerald-200 text-xs">Active Subscriptions</p>
              <p className="text-xl font-semibold">{metrics.activeSubscriptions}</p>
            </div>
            <div>
              <p className="text-emerald-200 text-xs">New This Month</p>
              <p className="text-xl font-semibold text-emerald-100">+{metrics.newSubscriptionsThisMonth}</p>
            </div>
            <div>
              <p className="text-emerald-200 text-xs">Churned</p>
              <p className="text-xl font-semibold text-red-200">-{metrics.canceledThisMonth}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Conversion Rate</p>
              <p className="mt-2 text-4xl font-bold">{metrics.conversionRate}%</p>
              <p className="mt-1 text-blue-200 text-sm">
                Free to Paid
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-blue-400/30 grid grid-cols-2 gap-4">
            <div>
              <p className="text-blue-200 text-xs">Paid Users</p>
              <p className="text-xl font-semibold">{metrics.paidUsers}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Free Users</p>
              <p className="text-xl font-semibold">{metrics.freeUsers}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Period Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueCard
          title="Today"
          value={formatCurrency(metrics.revenueToday)}
          icon={DollarSign}
          color="green"
        />
        <RevenueCard
          title="This Week"
          value={formatCurrency(metrics.revenueThisWeek)}
          icon={DollarSign}
          color="blue"
        />
        <RevenueCard
          title="This Month"
          value={formatCurrency(metrics.revenueThisMonth)}
          icon={DollarSign}
          color="purple"
          trend={monthlyGrowth !== 0 ? { value: monthlyGrowth, positive: monthlyGrowth > 0 } : undefined}
        />
        <RevenueCard
          title="This Year"
          value={formatCurrency(metrics.revenueThisYear)}
          icon={DollarSign}
          color="amber"
        />
      </div>
      
      {/* Plan Revenue Breakdown */}
      {metrics.planBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.planBreakdown.map(plan => (
              <div key={plan.plan} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 capitalize">{plan.plan}</p>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {plan.count} users
                  </span>
                </div>
                <p className="mt-2 text-xl font-bold text-gray-900">
                  {formatCurrency(plan.mrr)}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
          <a
            href={`${stripeDashboardUrl}/payments`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all in Stripe →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No payments yet
                  </td>
                </tr>
              ) : (
                recentPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {payment.customerName || payment.customerEmail || 'Unknown'}
                        </p>
                        {payment.customerName && payment.customerEmail && (
                          <p className="text-xs text-gray-500">{payment.customerEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {formatCurrencyDetailed(payment.amount, payment.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        payment.status === 'succeeded' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : payment.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(payment.created)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </RealtimeWrapper>
  )
}
