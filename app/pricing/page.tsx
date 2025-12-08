import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { AppNav } from '@/components/layout/AppNav'
import { PricingMatrix } from '@/components/pricing/PricingMatrix'
import { getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple storage-only pricing for photographers. Start free with 2GB, upgrade as you grow. Plans from $0 to $30/month.',
  openGraph: {
    title: 'Pricing — 12img Photo Gallery Platform',
    description: 'Simple storage-only pricing for photographers. Start free, upgrade as you grow.',
  },
}

export default async function PricingPage() {
  const { userId } = await auth()
  
  let userData = null
  let isAdmin = false
  
  if (userId) {
    [userData, isAdmin] = await Promise.all([
      getUserWithUsage(userId),
      checkIsAdmin(userId),
    ])
  }
  
  const plan = (userData?.plan || 'free') as PlanTier
  const planConfig = PLAN_TIERS[plan] || PLAN_TIERS.free
  const storageLimit = planConfig.storageGB * 1024 * 1024 * 1024
  
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {userId && (
        <AppNav 
          userPlan={plan}
          storageUsed={userData?.usage.totalBytes || 0}
          storageLimit={storageLimit}
          isAdmin={isAdmin}
        />
      )}
      <main>
        <div className={`container mx-auto px-4 pb-16 max-w-7xl ${userId ? 'pt-6 lg:pt-8' : 'pt-20 lg:pt-28'}`}>
          {/* Hero */}
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#141414] mb-3 lg:mb-4">
              Simple, honest pricing
            </h1>
            <p className="text-base lg:text-lg text-stone-500 max-w-2xl mx-auto px-4">
              No hidden fees. No video bloat. Just storage for photographers who need it.
            </p>
          </div>

          {/* Pricing Matrix */}
          <PricingMatrix showAllFeatures={true} currentPlan={userId ? plan : null} />

          {/* Contracts Feature Callout */}
          <div className="mt-16 bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-8 md:p-12 text-white">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-serif font-bold mb-3">
                  Smart Contracts Included
                </h2>
                <p className="text-stone-300 text-lg mb-4">
                  Professional contracts with e-signatures, client portals, messaging, and milestone tracking. 
                  Everything you need to manage clients—included with any paid plan.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    E-Signatures
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Client Portal
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Messaging
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Milestone Tracking
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">
                Trusted by photographers worldwide
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Secure Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Cancel Anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span className="text-sm">No Credit Card Required</span>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Teaser */}
          <div className="mt-16 text-center">
            <p className="text-gray-600">
              Questions? Check our{' '}
              <a href="#" className="text-[#141414] font-medium underline underline-offset-4 hover:text-gray-600">
                FAQ
              </a>{' '}
              or{' '}
              <a href="mailto:support@12img.com" className="text-[#141414] font-medium underline underline-offset-4 hover:text-gray-600">
                contact support
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
