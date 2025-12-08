import { Suspense } from 'react'
import { getEmailStats, listSubscribers, listCampaigns, getAllTags } from '@/server/admin/emails'
import { EmailDashboard } from './EmailDashboard'

interface Props {
  searchParams: Promise<{
    tab?: string
    page?: string
    search?: string
    status?: string
    tags?: string
  }>
}

export default async function AdminEmailsPage({ searchParams }: Props) {
  const params = await searchParams
  
  const tab = params.tab || 'overview'
  const page = Number(params.page) || 1
  
  // Fetch data based on tab
  const [stats, subscribers, campaigns, allTags] = await Promise.all([
    getEmailStats(),
    listSubscribers({
      page,
      pageSize: 50,
      search: params.search,
      status: params.status,
      tags: params.tags ? params.tags.split(',') : undefined,
    }),
    listCampaigns({ page: 1, pageSize: 10 }),
    getAllTags(),
  ])
  
  return (
    <div className="space-y-8 max-w-[1600px]">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl text-[#141414]">Email Marketing</h1>
        <p className="text-[#525252] mt-2">
          Manage subscribers, create campaigns, and track engagement
        </p>
      </div>
      
      <Suspense fallback={<div className="animate-pulse bg-stone-100 h-96 rounded-lg" />}>
        <EmailDashboard
          stats={stats}
          subscribers={subscribers}
          campaigns={campaigns}
          allTags={allTags}
          currentTab={tab}
          currentPage={page}
          searchQuery={params.search}
          statusFilter={params.status}
          tagsFilter={params.tags}
        />
      </Suspense>
    </div>
  )
}
