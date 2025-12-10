import { getDashboardStats } from '@/server/admin/users'
import { getRevenueMetrics } from '@/server/admin/billing'
import { DashboardContent } from './DashboardContent'

export default async function AdminDashboardPage() {
  const [stats, revenue] = await Promise.all([
    getDashboardStats(),
    getRevenueMetrics().catch(() => null), // Don't fail if Stripe is not configured
  ])
  
  return <DashboardContent stats={stats} revenue={revenue} />
}
