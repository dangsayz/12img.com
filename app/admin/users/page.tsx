import { Suspense } from 'react'
import { listUsers } from '@/server/admin/users'
import { UsersTable } from './UsersTable'
import { UsersFilters } from './UsersFilters'

interface Props {
  searchParams: Promise<{
    page?: string
    search?: string
    plan?: string
    role?: string
    suspended?: string
  }>
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
  
  const result = await listUsers({
    page,
    pageSize: 25,
    ...filters,
  })
  
  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl text-[#141414]">Users</h1>
          <p className="text-[#525252] mt-2">
            {result.total.toLocaleString()} total users
          </p>
        </div>
      </div>
      
      {/* Filters */}
      <UsersFilters />
      
      {/* Table */}
      <Suspense fallback={<div>Loading...</div>}>
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
