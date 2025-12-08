/**
 * Admin Email Marketing
 * 
 * Server-only module for email marketing from admin panel.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireCapability, logAdminAction } from './guards'
import type { PaginatedResult, PaginationParams } from '@/lib/admin/types'

// Types
export interface EmailSubscriber {
  id: string
  user_id: string | null
  email: string
  name: string | null
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained'
  source: string
  preferences: {
    marketing: boolean
    product_updates: boolean
    tips: boolean
  }
  emails_received: number
  emails_opened: number
  emails_clicked: number
  last_email_at: string | null
  last_opened_at: string | null
  last_clicked_at: string | null
  unsubscribed_at: string | null
  tags: string[]
  created_at: string
  updated_at: string
  // Joined data
  user?: {
    plan: string
    role: string
  }
}

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  preview_text: string | null
  html_content: string
  text_content: string | null
  segment_filter: Record<string, unknown>
  tags_filter: string[]
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  scheduled_at: string | null
  sent_at: string | null
  completed_at: string | null
  total_recipients: number
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_bounced: number
  total_unsubscribed: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EmailTemplate {
  id: string
  name: string
  description: string | null
  subject: string
  preview_text: string | null
  html_content: string
  text_content: string | null
  variables: Array<{ name: string; default: string }>
  category: string
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SubscriberFilters {
  search?: string
  status?: string
  source?: string
  tags?: string[]
  hasUser?: boolean
  plan?: string
}

export interface EmailStats {
  totalSubscribers: number
  activeSubscribers: number
  unsubscribed: number
  bounced: number
  totalCampaigns: number
  totalEmailsSent: number
  avgOpenRate: number
  avgClickRate: number
  recentCampaigns: EmailCampaign[]
  subscriberGrowth: Array<{ date: string; count: number }>
}

/**
 * Get email marketing statistics
 */
export async function getEmailStats(): Promise<EmailStats> {
  await requireCapability('users.list')
  
  // Total subscribers
  const { count: totalSubscribers } = await supabaseAdmin
    .from('email_subscribers')
    .select('*', { count: 'exact', head: true })
  
  // Active subscribers
  const { count: activeSubscribers } = await supabaseAdmin
    .from('email_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
  
  // Unsubscribed
  const { count: unsubscribed } = await supabaseAdmin
    .from('email_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unsubscribed')
  
  // Bounced
  const { count: bounced } = await supabaseAdmin
    .from('email_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'bounced')
  
  // Total campaigns
  const { count: totalCampaigns } = await supabaseAdmin
    .from('email_campaigns')
    .select('*', { count: 'exact', head: true })
  
  // Campaign stats
  const { data: campaigns } = await supabaseAdmin
    .from('email_campaigns')
    .select('total_sent, total_opened, total_clicked')
    .eq('status', 'sent')
  
  const totalEmailsSent = campaigns?.reduce((sum, c) => sum + c.total_sent, 0) || 0
  const totalOpened = campaigns?.reduce((sum, c) => sum + c.total_opened, 0) || 0
  const totalClicked = campaigns?.reduce((sum, c) => sum + c.total_clicked, 0) || 0
  
  const avgOpenRate = totalEmailsSent > 0 ? (totalOpened / totalEmailsSent) * 100 : 0
  const avgClickRate = totalEmailsSent > 0 ? (totalClicked / totalEmailsSent) * 100 : 0
  
  // Recent campaigns
  const { data: recentCampaigns } = await supabaseAdmin
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Subscriber growth (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: growthData } = await supabaseAdmin
    .from('email_subscribers')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })
  
  // Group by date
  const growthMap = new Map<string, number>()
  growthData?.forEach(sub => {
    const date = new Date(sub.created_at).toISOString().split('T')[0]
    growthMap.set(date, (growthMap.get(date) || 0) + 1)
  })
  
  const subscriberGrowth = Array.from(growthMap.entries()).map(([date, count]) => ({
    date,
    count,
  }))
  
  return {
    totalSubscribers: totalSubscribers || 0,
    activeSubscribers: activeSubscribers || 0,
    unsubscribed: unsubscribed || 0,
    bounced: bounced || 0,
    totalCampaigns: totalCampaigns || 0,
    totalEmailsSent,
    avgOpenRate,
    avgClickRate,
    recentCampaigns: (recentCampaigns || []) as EmailCampaign[],
    subscriberGrowth,
  }
}

/**
 * List all subscribers with pagination and filters
 */
export async function listSubscribers(
  params: PaginationParams & SubscriberFilters = {}
): Promise<PaginatedResult<EmailSubscriber>> {
  await requireCapability('users.list')
  
  const {
    page = 1,
    pageSize = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
    search,
    status,
    source,
    tags,
    hasUser,
    plan,
  } = params
  
  // Build query
  let query = supabaseAdmin
    .from('email_subscribers')
    .select(`
      *,
      user:users(plan, role)
    `, { count: 'exact' })
  
  // Apply filters
  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (source) {
    query = query.eq('source', source)
  }
  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags)
  }
  if (hasUser !== undefined) {
    if (hasUser) {
      query = query.not('user_id', 'is', null)
    } else {
      query = query.is('user_id', null)
    }
  }
  
  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  
  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(`Failed to list subscribers: ${error.message}`)
  }
  
  // Filter by plan if needed (post-query since it's a joined field)
  let filteredData = data || []
  if (plan) {
    filteredData = filteredData.filter(sub => sub.user?.plan === plan)
  }
  
  return {
    data: filteredData as EmailSubscriber[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * Get a single subscriber
 */
export async function getSubscriber(id: string): Promise<EmailSubscriber> {
  await requireCapability('users.view')
  
  const { data, error } = await supabaseAdmin
    .from('email_subscribers')
    .select(`
      *,
      user:users(plan, role)
    `)
    .eq('id', id)
    .single()
  
  if (error || !data) {
    throw new Error('Subscriber not found')
  }
  
  return data as EmailSubscriber
}

/**
 * Update subscriber status
 */
export async function updateSubscriberStatus(
  id: string,
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained'
): Promise<void> {
  const admin = await requireCapability('users.list')
  
  const updates: Record<string, unknown> = { status }
  if (status === 'unsubscribed') {
    updates.unsubscribed_at = new Date().toISOString()
  }
  
  const { error } = await supabaseAdmin
    .from('email_subscribers')
    .update(updates)
    .eq('id', id)
  
  if (error) {
    throw new Error(`Failed to update subscriber: ${error.message}`)
  }
  
  await logAdminAction(admin.userId, 'user.view' as any, {
    targetType: 'subscriber',
    targetId: id,
    metadata: { status },
  })
}

/**
 * Add tags to subscriber
 */
export async function addSubscriberTags(id: string, tags: string[]): Promise<void> {
  await requireCapability('users.list')
  
  const { data: subscriber } = await supabaseAdmin
    .from('email_subscribers')
    .select('tags')
    .eq('id', id)
    .single()
  
  const existingTags = subscriber?.tags || []
  const newTags = [...new Set([...existingTags, ...tags])]
  
  const { error } = await supabaseAdmin
    .from('email_subscribers')
    .update({ tags: newTags })
    .eq('id', id)
  
  if (error) {
    throw new Error(`Failed to add tags: ${error.message}`)
  }
}

/**
 * Remove tag from subscriber
 */
export async function removeSubscriberTag(id: string, tag: string): Promise<void> {
  await requireCapability('users.list')
  
  const { data: subscriber } = await supabaseAdmin
    .from('email_subscribers')
    .select('tags')
    .eq('id', id)
    .single()
  
  const existingTags = subscriber?.tags || []
  const newTags = existingTags.filter((t: string) => t !== tag)
  
  const { error } = await supabaseAdmin
    .from('email_subscribers')
    .update({ tags: newTags })
    .eq('id', id)
  
  if (error) {
    throw new Error(`Failed to remove tag: ${error.message}`)
  }
}

/**
 * Export subscribers as CSV
 */
export async function exportSubscribers(
  filters: SubscriberFilters = {}
): Promise<string> {
  await requireCapability('users.list')
  
  // Get all matching subscribers
  let query = supabaseAdmin
    .from('email_subscribers')
    .select(`
      email,
      name,
      status,
      source,
      tags,
      emails_received,
      emails_opened,
      emails_clicked,
      created_at,
      user:users(plan)
    `)
    .eq('status', 'active')
  
  if (filters.search) {
    query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
  }
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    throw new Error(`Failed to export: ${error.message}`)
  }
  
  // Generate CSV
  const headers = ['Email', 'Name', 'Status', 'Source', 'Tags', 'Plan', 'Emails Received', 'Open Rate', 'Created At']
  const rows = (data || []).map(sub => {
    const openRate = sub.emails_received > 0 
      ? ((sub.emails_opened / sub.emails_received) * 100).toFixed(1) + '%'
      : '0%'
    return [
      sub.email,
      sub.name || '',
      sub.status,
      sub.source,
      (sub.tags || []).join('; '),
      (sub.user as any)?.plan || 'free',
      sub.emails_received,
      openRate,
      new Date(sub.created_at).toLocaleDateString(),
    ]
  })
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  return csv
}

/**
 * List all campaigns
 */
export async function listCampaigns(
  params: PaginationParams & { status?: string } = {}
): Promise<PaginatedResult<EmailCampaign>> {
  await requireCapability('users.list')
  
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
    status,
  } = params
  
  let query = supabaseAdmin
    .from('email_campaigns')
    .select('*', { count: 'exact' })
  
  if (status) {
    query = query.eq('status', status)
  }
  
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(`Failed to list campaigns: ${error.message}`)
  }
  
  return {
    data: (data || []) as EmailCampaign[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at' | 'total_recipients' | 'total_sent' | 'total_delivered' | 'total_opened' | 'total_clicked' | 'total_bounced' | 'total_unsubscribed'>
): Promise<EmailCampaign> {
  const admin = await requireCapability('users.list')
  
  const { data, error } = await supabaseAdmin
    .from('email_campaigns')
    .insert({
      ...campaign,
      created_by: admin.userId,
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create campaign: ${error.message}`)
  }
  
  await logAdminAction(admin.userId, 'user.view' as any, {
    targetType: 'campaign',
    targetId: data.id,
    metadata: { name: campaign.name },
  })
  
  return data as EmailCampaign
}

/**
 * Update a campaign
 */
export async function updateCampaign(
  id: string,
  updates: Partial<EmailCampaign>
): Promise<EmailCampaign> {
  const admin = await requireCapability('users.list')
  
  const { data, error } = await supabaseAdmin
    .from('email_campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update campaign: ${error.message}`)
  }
  
  await logAdminAction(admin.userId, 'user.view' as any, {
    targetType: 'campaign',
    targetId: id,
    metadata: { updates },
  })
  
  return data as EmailCampaign
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string): Promise<void> {
  const admin = await requireCapability('users.list')
  
  const { error } = await supabaseAdmin
    .from('email_campaigns')
    .delete()
    .eq('id', id)
  
  if (error) {
    throw new Error(`Failed to delete campaign: ${error.message}`)
  }
  
  await logAdminAction(admin.userId, 'user.view' as any, {
    targetType: 'campaign',
    targetId: id,
  })
}

/**
 * List all templates
 */
export async function listTemplates(): Promise<EmailTemplate[]> {
  await requireCapability('users.list')
  
  const { data, error } = await supabaseAdmin
    .from('email_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    throw new Error(`Failed to list templates: ${error.message}`)
  }
  
  return (data || []) as EmailTemplate[]
}

/**
 * Create a template
 */
export async function createTemplate(
  template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<EmailTemplate> {
  const admin = await requireCapability('users.list')
  
  const { data, error } = await supabaseAdmin
    .from('email_templates')
    .insert({
      ...template,
      created_by: admin.userId,
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create template: ${error.message}`)
  }
  
  return data as EmailTemplate
}

/**
 * Get unique tags from all subscribers
 */
export async function getAllTags(): Promise<string[]> {
  await requireCapability('users.list')
  
  const { data, error } = await supabaseAdmin
    .from('email_subscribers')
    .select('tags')
  
  if (error) {
    throw new Error(`Failed to get tags: ${error.message}`)
  }
  
  const allTags = new Set<string>()
  data?.forEach(sub => {
    (sub.tags || []).forEach((tag: string) => allTags.add(tag))
  })
  
  return Array.from(allTags).sort()
}
