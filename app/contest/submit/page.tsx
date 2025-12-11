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
import { Camera, Trophy, Star, Crown, Lightbulb, CheckCircle2 } from 'lucide-react'
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
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="relative pt-16 pb-12 px-6">
            <div className="max-w-2xl mx-auto text-center">
              {/* Success Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full mb-8">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 text-sm font-medium">Entry Submitted</span>
              </div>
              
              {/* Big Title */}
              <h1 className="text-4xl sm:text-5xl font-light text-stone-900 mb-4 tracking-tight">
                You're In!
              </h1>
              
              <p className="text-lg text-stone-500 mb-2">
                Your shot is now competing in
              </p>
              <p className="text-xl font-medium text-stone-900 mb-8">
                "{contest.theme || contest.name}"
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link
                  href={`/contest/${contest.id}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors rounded-full"
                >
                  <Camera className="w-5 h-5" />
                  View All Entries
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 text-stone-500 hover:text-stone-900 transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* What Happens Next */}
        <div className="px-6 pb-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-center text-stone-400 text-xs uppercase tracking-[0.2em] mb-12">
              What Happens Next
            </h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <span className="text-3xl font-light text-stone-300">01</span>
                <div>
                  <h3 className="text-stone-900 font-medium mb-1">Community Votes</h3>
                  <p className="text-stone-500 text-sm">
                    Other photographers will vote for their favorite shots during the voting period.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <span className="text-3xl font-light text-stone-300">02</span>
                <div>
                  <h3 className="text-stone-900 font-medium mb-1">Winners Announced</h3>
                  <p className="text-stone-500 text-sm">
                    Top voted shots win the spotlight and get featured on our homepage.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <span className="text-3xl font-light text-stone-300">03</span>
                <div>
                  <h3 className="text-stone-900 font-medium mb-1">Get Recognized</h3>
                  <p className="text-stone-500 text-sm">
                    Winners earn badges and profile recognition visible to all clients.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contest Tiers */}
        <div className="px-6 pb-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-center text-stone-400 text-xs uppercase tracking-[0.2em] mb-2">
              The Spotlight Awards
            </h2>
            <p className="text-center text-stone-500 text-sm mb-10">
              Compete across multiple timeframes for ultimate recognition
            </p>
            
            <div className="border-t border-stone-200">
              <div className="flex items-center justify-between py-4 border-b border-stone-100">
                <div>
                  <h3 className="text-stone-900 font-medium text-sm">Shot of the Day</h3>
                  <p className="text-stone-400 text-xs">Top voted shot each day</p>
                </div>
                <span className="text-xs text-stone-400 uppercase tracking-wider">Daily</span>
              </div>
              
              <div className="flex items-center justify-between py-4 border-b border-stone-100">
                <div>
                  <h3 className="text-stone-900 font-medium text-sm">Weekly Winner</h3>
                  <p className="text-stone-400 text-xs">Best performing shot of the week</p>
                </div>
                <span className="text-xs text-stone-400 uppercase tracking-wider">7 Days</span>
              </div>
              
              <div className="flex items-center justify-between py-4 border-b border-stone-100">
                <div>
                  <h3 className="text-stone-900 font-medium text-sm">Monthly Champion</h3>
                  <p className="text-stone-400 text-xs">Win the monthly theme contest</p>
                </div>
                <span className="text-xs text-stone-400 uppercase tracking-wider">30 Days</span>
              </div>
              
              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="text-stone-900 font-medium text-sm">Photographer of the Year</h3>
                  <p className="text-stone-400 text-xs">Most consistent excellence</p>
                </div>
                <span className="text-xs text-stone-400 uppercase tracking-wider">Annual</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pro Tip */}
        <div className="px-6 pb-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-stone-400 text-sm italic">
              "The more votes you get, the higher you rank. Share your entry with your audience."
            </p>
          </div>
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
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center">
              <Camera className="w-7 h-7 text-stone-400" />
            </div>
            
            <h3 className="text-lg font-light text-stone-900 mb-2">
              No galleries yet
            </h3>
            <p className="text-sm text-stone-500 mb-8 max-w-sm mx-auto">
              Upload your work first, then return to enter the Spotlight.
            </p>
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors rounded-full"
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
