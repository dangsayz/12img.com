import { Suspense } from 'react'
import { listUsers, getUserPageStats } from '@/server/admin/users'
import { UsersTable } from './UsersTable'
import { UsersFilters } from './UsersFilters'
import { UsersStats } from './UsersStats'

interface Props {
  searchParams: Promise<{
    page?: string
    search?: string
    plan?: string
    role?: string
    suspended?: string
  }>
}

function TableSkeleton() {
  return (
    <div className="bg-white border border-[#E5E5E5] overflow-hidden animate-pulse">
      <div className="bg-[#F5F5F7] border-b border-[#E5E5E5] h-14" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-[#E5E5E5]">
          <div className="w-9 h-9 bg-[#F5F5F7] rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#F5F5F7] rounded w-48" />
            <div className="h-3 bg-[#F5F5F7] rounded w-24" />
          </div>
          <div className="h-6 bg-[#F5F5F7] rounded w-16" />
          <div className="h-6 bg-[#F5F5F7] rounded w-16" />
          <div className="h-6 bg-[#F5F5F7] rounded w-20" />
        </div>
      ))}
    </div>
  )
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams
  
  const page = Number(params.page) || 1
  const filters = {
    search: params.search,
    plan: params.plan,
    role: params.role as any,
    isSuspended: params.suspended === 'true' ? true : params.suspended === 'false' ? false : undefined,
  }
  
  // Fetch data in parallel
  const [result, stats] = await Promise.all([
    listUsers({
      page,
      pageSize: 25,
      ...filters,
    }),
    getUserPageStats(),
  ])
  
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl text-[#141414] tracking-tight">Users</h1>
          <p className="text-[#737373] mt-1 text-sm">
            Manage your user base and monitor activity
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-light text-[#141414] tabular-nums">
            {result.total.toLocaleString()}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#737373]">
            {filters.search || filters.plan || filters.role || filters.isSuspended !== undefined 
              ? 'Matching Users' 
              : 'Total Users'}
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <UsersStats stats={stats} />
      
      {/* Filters */}
      <UsersFilters />
      
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <UsersTable 
          users={result.data}
          pagination={{
            page: result.page,
            totalPages: result.totalPages,
            total: result.total,
          }}
        />
      </Suspense>
    </div>
  )
}
