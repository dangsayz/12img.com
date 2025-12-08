import { auth } from '@clerk/nextjs/server'
import { AppNav } from '@/components/layout/AppNav'
import { getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'
import { Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Help Center | 12img',
  description: 'Get help with 12img gallery platform. FAQs and support.',
}

const faqs = [
  {
    q: 'How do I share a gallery with clients?',
    a: 'After uploading photos, copy the gallery link and send it to your client. You can set a password for extra security.',
  },
  {
    q: 'Can clients download photos?',
    a: 'Yes! You control this per gallery. Enable downloads in gallery settings, and clients can download individual photos or the entire gallery as a ZIP.',
  },
  {
    q: 'How long do galleries stay active?',
    a: 'Free galleries expire after 7 days. Paid plans offer 30-day or unlimited gallery links.',
  },
  {
    q: 'What image formats are supported?',
    a: 'We support JPEG, PNG, WebP, and GIF. Maximum file size is 25MB per image.',
  },
  {
    q: 'Can I customize my gallery appearance?',
    a: 'Pro and Studio plans include custom branding options like logos and color schemes.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings → Danger Zone → Delete Account. This permanently removes all your data.',
  },
]

export default async function HelpPage() {
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
    <div className="min-h-screen bg-stone-50">
      {userId && (
        <AppNav 
          userPlan={plan}
          storageUsed={userData?.usage.totalBytes || 0}
          storageLimit={storageLimit}
          isAdmin={isAdmin}
        />
      )}
      
      <main className={userId ? 'pt-8' : 'pt-24'}>
        <div className="max-w-3xl mx-auto px-6 pb-24">
          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight mb-4">
              Help Center
            </h1>
            <p className="text-lg text-stone-500">
              Everything you need to know about using 12img
            </p>
          </header>
          
          <div className="space-y-12">
        {/* FAQ Section */}
        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-[#E8E4DC] pb-6">
                <h3 className="font-medium text-[#1C1917] mb-2">{faq.q}</h3>
                <p className="text-[#78716C]">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-6">Still need help?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="mailto:support@12img.com"
              className="flex items-center gap-4 p-5 rounded-2xl border border-[#E8E4DC] hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
            >
              <div className="p-3 bg-[#FAF8F3] rounded-xl">
                <Mail className="w-5 h-5 text-[#78716C]" />
              </div>
              <div>
                <p className="font-medium text-[#1C1917]">Email Support</p>
                <p className="text-sm text-[#78716C]">support@12img.com</p>
              </div>
            </a>
            <a
              href="https://twitter.com/12img"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-2xl border border-[#E8E4DC] hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
            >
              <div className="p-3 bg-[#FAF8F3] rounded-xl">
                <MessageCircle className="w-5 h-5 text-[#78716C]" />
              </div>
              <div>
                <p className="font-medium text-[#1C1917]">Twitter/X</p>
                <p className="text-sm text-[#78716C]">@12img</p>
              </div>
            </a>
          </div>
        </section>
          </div>
        </div>
      </main>
    </div>
  )
}
