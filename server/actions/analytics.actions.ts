'use server'

import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'

export interface GalleryAnalytics {
  totalViews: number
  uniqueViews: number
  viewsToday: number
  viewsThisWeek: number
  totalDownloads: number
  uniqueDownloads: number
  downloadsToday: number
  downloadsThisWeek: number
  firstViewAt: string | null
  lastViewAt: string | null
  firstDownloadAt: string | null
  lastDownloadAt: string | null
}

export interface RecentActivity {
  type: 'view' | 'download'
  visitorId: string
  createdAt: string
  referrer?: string
  downloadType?: string
}

/**
 * Get analytics for a specific gallery.
 * Only accessible by gallery owner.
 */
export async function getGalleryAnalytics(galleryId: string): Promise<{
  analytics: GalleryAnalytics | null
  recentActivity: RecentActivity[]
  error?: string
}> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { analytics: null, recentActivity: [], error: 'Unauthorized' }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { analytics: null, recentActivity: [], error: 'User not found' }
  }

  try {
    // Verify gallery ownership
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id, user_id')
      .eq('id', galleryId)
      .eq('user_id', user.id)
      .single()

    if (galleryError || !gallery) {
      return { analytics: null, recentActivity: [], error: 'Gallery not found' }
    }

    // Get aggregated analytics using database function
    const { data: analyticsData, error: analyticsError } = await supabaseAdmin
      .rpc('get_gallery_analytics', { p_gallery_id: galleryId })

    if (analyticsError) {
      console.error('[getGalleryAnalytics] Error fetching analytics:', analyticsError)
      // Return empty analytics if function doesn't exist yet
      return { 
        analytics: getEmptyAnalytics(), 
        recentActivity: [],
        error: undefined 
      }
    }

    // Get recent activity (last 20 events)
    const [viewsResult, downloadsResult] = await Promise.all([
      supabaseAdmin
        .from('gallery_views')
        .select('visitor_id, created_at, referrer')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('gallery_downloads')
        .select('visitor_id, created_at, download_type')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    const recentActivity: RecentActivity[] = []

    if (viewsResult.data) {
      for (const view of viewsResult.data) {
        recentActivity.push({
          type: 'view',
          visitorId: (view.visitor_id as string).substring(0, 8),
          createdAt: view.created_at as string,
          referrer: view.referrer as string | undefined
        })
      }
    }

    if (downloadsResult.data) {
      for (const download of downloadsResult.data) {
        recentActivity.push({
          type: 'download',
          visitorId: (download.visitor_id as string).substring(0, 8),
          createdAt: download.created_at as string,
          downloadType: download.download_type as string
        })
      }
    }

    // Sort by created_at descending
    recentActivity.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Transform database result to our interface
    const row = Array.isArray(analyticsData) ? analyticsData[0] : analyticsData
    
    if (!row) {
      return { analytics: getEmptyAnalytics(), recentActivity: recentActivity.slice(0, 20) }
    }

    const analytics: GalleryAnalytics = {
      totalViews: row.total_views ?? 0,
      uniqueViews: row.unique_views ?? 0,
      viewsToday: row.views_today ?? 0,
      viewsThisWeek: row.views_this_week ?? 0,
      totalDownloads: row.total_downloads ?? 0,
      uniqueDownloads: row.unique_downloads ?? 0,
      downloadsToday: row.downloads_today ?? 0,
      downloadsThisWeek: row.downloads_this_week ?? 0,
      firstViewAt: row.first_view_at ?? null,
      lastViewAt: row.last_view_at ?? null,
      firstDownloadAt: row.first_download_at ?? null,
      lastDownloadAt: row.last_download_at ?? null,
    }

    return { analytics, recentActivity: recentActivity.slice(0, 20) }
  } catch (e) {
    console.error('[getGalleryAnalytics] Error:', e)
    return { analytics: null, recentActivity: [], error: 'Failed to fetch analytics' }
  }
}

function getEmptyAnalytics(): GalleryAnalytics {
  return {
    totalViews: 0,
    uniqueViews: 0,
    viewsToday: 0,
    viewsThisWeek: 0,
    totalDownloads: 0,
    uniqueDownloads: 0,
    downloadsToday: 0,
    downloadsThisWeek: 0,
    firstViewAt: null,
    lastViewAt: null,
    firstDownloadAt: null,
    lastDownloadAt: null,
  }
}
