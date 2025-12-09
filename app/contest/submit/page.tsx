/**
 * ============================================================================
 * CONTEST SUBMISSION PAGE
 * ============================================================================
 * 
 * Allows users to submit a photo to the active contest.
 * Two options:
 * 1. Pick from existing gallery
 * 2. Upload new photo (future enhancement)
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getActiveContest } from '@/server/actions/contest.actions'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getUserWithUsage } from '@/server/queries/user.queries'
import { normalizePlanId } from '@/lib/config/pricing'
import { SubmissionFormClient } from './SubmissionFormClient'

export const dynamic = 'force-dynamic'

// Paid plans that can participate in contests
const PAID_PLANS = ['essential', 'pro', 'studio', 'elite']

export default async function ContestSubmitPage() {
  // Check auth via Clerk (middleware already protects this route)
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    redirect('/')
  }
  
  // Get user with plan info
  const userData = await getUserWithUsage(clerkId)
  if (!userData) {
    console.log('[Contest Submit] No DB user found for Clerk ID:', clerkId)
    redirect('/')
  }
  const userId = userData.id
  const userPlan = normalizePlanId(userData.plan)
  const isPaidUser = PAID_PLANS.includes(userPlan)
  
  console.log('[Contest Submit] User ID:', userId, 'Plan:', userPlan, 'Paid:', isPaidUser)
  
  // Get active contest
  const contest = await getActiveContest()
  
  // Check if user is on a paid plan - show upgrade prompt if not
  if (!isPaidUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-stone-900 mb-3">
            Upgrade to Participate
          </h1>
          <p className="text-stone-500 mb-8">
            Community Spotlight is available for paid members. Upgrade your plan to submit photos and vote for your favorites.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              View Plans
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  if (!contest) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-light text-stone-900 mb-3">
            No Active Contest
          </h1>
          <p className="text-stone-500 mb-8">
            Check back soon for the next Community Spotlight.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }
  
  if (contest.status !== 'submissions_open') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-light text-stone-900 mb-3">
            Submissions Closed
          </h1>
          <p className="text-stone-500 mb-8">
            {contest.status === 'voting' 
              ? 'Voting is now open! Check out the entries.'
              : 'This contest has ended.'}
          </p>
          <Link
            href={`/contest/${contest.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
          >
            {contest.status === 'voting' ? 'Vote Now' : 'View Results'}
          </Link>
        </div>
      </div>
    )
  }
  
  // Check if user already submitted
  const { data: existingEntry } = await supabaseAdmin
    .from('contest_entries')
    .select('id')
    .eq('contest_id', contest.id)
    .eq('user_id', userId)
    .single()
  
  if (existingEntry) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-stone-900 mb-3">
            Already Submitted
          </h1>
          <p className="text-stone-500 mb-8">
            You've already entered this contest. Good luck!
          </p>
          <Link
            href={`/contest/${contest.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
          >
            View Entries
          </Link>
        </div>
      </div>
    )
  }
  
  // Get user's galleries with images
  // Note: Must specify the foreign key hint because galleries has multiple relationships to images
  // (gallery_id for images in gallery, cover_image_id for cover image)
  const { data: galleries, error: galleriesError } = await supabaseAdmin
    .from('galleries')
    .select(`
      id,
      title,
      images!images_gallery_id_fkey (
        id,
        storage_path,
        width,
        height
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  console.log('[Contest Submit] Galleries query result:', { 
    count: galleries?.length || 0, 
    error: galleriesError?.message,
    userId,
    galleries: galleries?.map(g => ({ id: g.id, title: g.title, imageCount: g.images?.length || 0 }))
  })
  
  // Filter galleries that have images
  const galleriesWithImages = (galleries || []).filter(
    (g: any) => g.images && g.images.length > 0
  )
  
  console.log('[Contest Submit] Galleries with images:', galleriesWithImages.length)
  
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/90 backdrop-blur-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-sm"
        >
          <span>←</span>
          <span>Back</span>
        </Link>
      </header>
      
      {/* Hero Section - Clean, Editorial */}
      <div className="relative pt-24 pb-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Contest Badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-1 h-1 rounded-full bg-stone-300" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
              Community Spotlight
            </span>
            <div className="w-1 h-1 rounded-full bg-stone-300" />
          </div>
          
          {/* Theme - Large, Elegant */}
          <h1 className="text-4xl sm:text-5xl font-light text-stone-900 tracking-tight mb-4">
            {contest.theme || contest.name}
          </h1>
          
          {/* Description */}
          {contest.description && (
            <p className="text-stone-500 text-lg font-light max-w-md mx-auto mb-6">
              {contest.description}
            </p>
          )}
          
          {/* Motivation Text */}
          <p className="text-stone-400 text-sm max-w-sm mx-auto">
            Select your finest work. One image. One chance to be featured.
          </p>
        </div>
      </div>
      
      {/* Divider */}
      <div className="max-w-xs mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
      </div>
      
      {/* Submission Form */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        {galleriesWithImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center">
              <svg className="w-7 h-7 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-light text-white mb-2">
              No galleries yet
            </h3>
            <p className="text-sm text-stone-500 mb-8 max-w-sm mx-auto">
              Upload your work first, then return to enter the Spotlight.
            </p>
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-stone-900 text-sm font-medium hover:bg-stone-100 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <SubmissionFormClient
            contestId={contest.id}
            galleries={galleriesWithImages}
          />
        )}
      </main>
    </div>
  )
}
