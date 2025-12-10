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
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; positive: boolean }
}) {
  return (
    <div className="bg-white border border-[#E5E5E5] p-6 hover:border-[#141414] transition-colors duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[#525252]">{title}</p>
          <p className="mt-2 text-3xl font-serif text-[#141414]">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-[#525252]">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              {trend.positive ? (
                <TrendingUp className="w-3 h-3 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span className={trend.positive ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-[#525252]">vs last month</span>
            </div>
          )}
        </div>
        <div className="p-2 border border-[#E5E5E5]">
          <Icon className="w-5 h-5 text-[#525252]" />
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
      <div className="space-y-8 max-w-[1400px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#141414]">Revenue & Billing</h1>
            <p className="text-[#525252] mt-2">
              Real-time revenue metrics and payment history
            </p>
          </div>
          <a
            href={stripeDashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#141414] bg-white border border-[#E5E5E5] hover:border-[#141414] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Stripe Dashboard
        </a>
      </div>
      
      {/* Hero Revenue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Card */}
        <div className="lg:col-span-2 bg-[#141414] p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block px-3 py-1 border border-white/20 text-xs font-medium uppercase tracking-wider mb-4">
                Monthly Recurring Revenue
              </span>
              <p className="text-5xl font-serif">{formatCurrency(metrics.mrr)}</p>
              <p className="mt-2 text-white/60 text-sm">
                {formatCurrency(metrics.arr)} ARR
              </p>
            </div>
            <div className="p-3 border border-white/20">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-6">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Active Subs</p>
              <p className="text-2xl font-serif mt-1">{metrics.activeSubscriptions}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">New This Month</p>
              <p className="text-2xl font-serif mt-1 text-emerald-400">+{metrics.newSubscriptionsThisMonth}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Churned</p>
              <p className="text-2xl font-serif mt-1 text-red-400">-{metrics.canceledThisMonth}</p>
            </div>
          </div>
        </div>
        
        {/* Conversion Card */}
        <div className="bg-white border border-[#E5E5E5] p-8">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block px-3 py-1 border border-[#141414] text-xs font-medium uppercase tracking-wider mb-4 text-[#141414]">
                Conversion Rate
              </span>
              <p className="text-5xl font-serif text-[#141414]">{metrics.conversionRate}%</p>
              <p className="mt-2 text-[#525252] text-sm">Free to Paid</p>
            </div>
            <div className="p-3 border border-[#E5E5E5]">
              <ArrowUpRight className="w-6 h-6 text-[#525252]" />
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#E5E5E5] grid grid-cols-2 gap-6">
            <div>
              <p className="text-[#525252] text-xs uppercase tracking-wider">Paid Users</p>
              <p className="text-2xl font-serif text-[#141414] mt-1">{metrics.paidUsers}</p>
              {metrics.paidUsersManual > 0 && (
                <p className="text-[10px] text-amber-600 mt-0.5">
                  {metrics.paidUsersStripe} Stripe · {metrics.paidUsersManual} comp
                </p>
              )}
            </div>
            <div>
              <p className="text-[#525252] text-xs uppercase tracking-wider">Free Users</p>
              <p className="text-2xl font-serif text-[#141414] mt-1">{metrics.freeUsers}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Period Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <RevenueCard
          title="Today"
          value={formatCurrency(metrics.revenueToday)}
          icon={DollarSign}
        />
        <RevenueCard
          title="This Week"
          value={formatCurrency(metrics.revenueThisWeek)}
          icon={DollarSign}
        />
        <RevenueCard
          title="This Month"
          value={formatCurrency(metrics.revenueThisMonth)}
          icon={DollarSign}
          trend={monthlyGrowth !== 0 ? { value: monthlyGrowth, positive: monthlyGrowth > 0 } : undefined}
        />
        <RevenueCard
          title="This Year"
          value={formatCurrency(metrics.revenueThisYear)}
          icon={DollarSign}
        />
      </div>
      
      {/* Plan Revenue Breakdown */}
      {metrics.planBreakdown.length > 0 && (
        <div className="bg-white border border-[#E5E5E5] p-8">
          <h2 className="font-serif text-2xl text-[#141414] mb-6">Revenue by Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.planBreakdown.map(plan => (
              <div key={plan.plan} className="p-5 border border-[#E5E5E5] hover:border-[#141414] transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#141414] uppercase tracking-wider">{plan.plan}</p>
                  <span className="text-xs border border-[#E5E5E5] text-[#525252] px-2 py-0.5">
                    {plan.count} users
                  </span>
                </div>
                <p className="mt-3 text-2xl font-serif text-[#141414]">
                  {formatCurrency(plan.mrr)}
                  <span className="text-sm font-sans text-[#525252]">/mo</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Payments */}
      <div className="bg-white border border-[#E5E5E5]">
        <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5]">
          <h2 className="font-serif text-2xl text-[#141414]">Recent Payments</h2>
          <a
            href={`${stripeDashboardUrl}/payments`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#141414] font-medium border-b border-[#141414] pb-0.5 hover:text-[#525252] hover:border-[#525252] transition-colors"
          >
            View all in Stripe →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F7] border-b border-[#E5E5E5]">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#525252]">
                    No payments yet
                  </td>
                </tr>
              ) : (
                recentPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#141414]">
                          {payment.customerName || payment.customerEmail || 'Unknown'}
                        </p>
                        {payment.customerName && payment.customerEmail && (
                          <p className="text-xs text-[#525252] mt-0.5">{payment.customerEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-serif text-lg text-[#141414]">
                        {formatCurrencyDetailed(payment.amount, payment.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${
                        payment.status === 'succeeded' 
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : payment.status === 'pending'
                          ? 'border border-amber-200 bg-amber-50 text-amber-700'
                          : 'border border-red-200 bg-red-50 text-red-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#525252]">
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
