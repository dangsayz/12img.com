import type { Metadata } from 'next'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import Link from 'next/link'
import { Mail, Eye, MousePointer, Download, BarChart3, Bell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Email Tracking — 12img',
  description: 'Know when clients open your gallery emails, click links, and download photos. Professional email analytics for photographers.',
  openGraph: {
    title: 'Email Tracking — 12img',
    description: 'Know when clients open your gallery emails, click links, and download photos.',
  },
}

const features = [
  {
    icon: Eye,
    title: 'Open Tracking',
    description: 'Know exactly when your client opens the gallery email. No more wondering if they received it.',
  },
  {
    icon: MousePointer,
    title: 'Click Tracking',
    description: 'See when clients click through to view the gallery. Track engagement in real-time.',
  },
  {
    icon: Download,
    title: 'Download Tracking',
    description: 'Get notified when clients download individual photos or the full gallery archive.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'View open rates, click rates, and download stats for all your gallery emails.',
  },
  {
    icon: Mail,
    title: 'Beautiful Emails',
    description: 'Send professional gallery invites that match your brand. No design skills needed.',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Get notified the moment a client engages with your gallery. Stay in the loop.',
  },
]

const stats = [
  { label: 'Emails Opened', value: '94%', description: 'Average open rate' },
  { label: 'Gallery Views', value: '89%', description: 'Click-through rate' },
  { label: 'Downloads', value: '76%', description: 'Download rate' },
]

export default function EmailTrackingPage() {
  return (
    <StaticPageLayout
      title="Email Tracking"
      subtitle="Know exactly when clients engage with your galleries."
      backLabel="Back to features"
      backHref="/features"
    >
      <div className="space-y-12">
        {/* Hero description */}
        <section>
          <p className="text-lg text-[#78716C] leading-relaxed">
            Stop wondering if your client saw the gallery. 12img tracks every email open, 
            link click, and download—so you always know where you stand.
          </p>
        </section>

        {/* Stats preview */}
        <section>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-white/50 border border-[#E8E4DC]">
                <div className="text-2xl sm:text-3xl font-bold text-[#1C1917]">{stat.value}</div>
                <div className="text-xs sm:text-sm text-[#78716C] mt-1">{stat.description}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#A8A29E] text-center mt-3">*Based on average 12img user data</p>
        </section>

        {/* Features grid */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1C1917] mb-8">What's Included</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl border border-[#E8E4DC] bg-white/50 hover:border-amber-200 hover:bg-amber-50/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-[#78716C]" />
                </div>
                <h3 className="font-semibold text-[#1C1917] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#78716C] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1C1917] mb-6">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-sm font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium text-[#1C1917]">Send a gallery invite</h3>
                <p className="text-[#78716C] text-sm">Use our built-in email tool or copy the tracking link.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-sm font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium text-[#1C1917]">We track engagement</h3>
                <p className="text-[#78716C] text-sm">Opens, clicks, and downloads are logged automatically.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-sm font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium text-[#1C1917]">View your stats</h3>
                <p className="text-[#78716C] text-sm">Check your dashboard or get instant notifications.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why it matters */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1C1917] mb-6">Why It Matters</h2>
          <ul className="space-y-3 text-[#78716C]">
            <li className="flex items-start gap-3">
              <span className="text-amber-500 mt-1">•</span>
              <span><strong className="text-[#1C1917]">Follow up at the right time</strong> — Know when clients are actively viewing</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-500 mt-1">•</span>
              <span><strong className="text-[#1C1917]">Reduce anxiety</strong> — No more "did they get it?" emails</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-500 mt-1">•</span>
              <span><strong className="text-[#1C1917]">Improve your workflow</strong> — Data-driven insights for better delivery</span>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="pt-4">
          <div className="p-8 rounded-2xl bg-[#1C1917] text-white text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to track your galleries?</h3>
            <p className="text-white/70 mb-6">Email tracking is included on all paid plans.</p>
            <Link 
              href="/sign-up"
              className="inline-block bg-white text-[#1C1917] font-semibold px-6 py-3 rounded-xl hover:bg-amber-50 transition-colors"
            >
              Start free
            </Link>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  )
}
