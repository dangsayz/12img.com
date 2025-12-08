import type { Metadata } from 'next'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import Link from 'next/link'
import { Archive, Download, Clock, Shield, HardDrive, Bell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Zip Backup — 12img',
  description: 'Automatic gallery backups for photographers. One-click ZIP downloads for you and your clients. Never lose a gallery again.',
  openGraph: {
    title: 'Zip Backup — 12img',
    description: 'Automatic gallery backups and one-click ZIP downloads for photographers.',
  },
}

const features = [
  {
    icon: Archive,
    title: 'Automatic Archives',
    description: 'Every gallery is automatically archived as a ZIP file. Ready to download whenever you need it.',
  },
  {
    icon: Download,
    title: 'One-Click Downloads',
    description: 'Clients can download the entire gallery with a single click. No complicated interfaces.',
  },
  {
    icon: Clock,
    title: 'Always Available',
    description: 'Archives are generated in the background. No waiting, no timeouts, even for large galleries.',
  },
  {
    icon: Shield,
    title: 'Secure Storage',
    description: 'Your archives are stored securely in the cloud. Access them anytime from your dashboard.',
  },
  {
    icon: HardDrive,
    title: 'Full Resolution',
    description: 'Downloads include your original, full-resolution images. No compression, no quality loss.',
  },
  {
    icon: Bell,
    title: 'Download Notifications',
    description: 'Get notified when clients download their gallery. Track engagement effortlessly.',
  },
]

export default function ZipBackupPage() {
  return (
    <StaticPageLayout
      title="Zip Backup"
      subtitle="Automatic archives and one-click downloads for every gallery."
      backLabel="Back to features"
      backHref="/features"
    >
      <div className="space-y-12">
        {/* Hero description */}
        <section>
          <p className="text-lg text-[#78716C] leading-relaxed">
            Never worry about gallery delivery again. 12img automatically creates ZIP archives 
            of every gallery, so you and your clients can download full-resolution images with 
            a single click.
          </p>
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
                <h3 className="font-medium text-[#1C1917]">Upload your gallery</h3>
                <p className="text-[#78716C] text-sm">As soon as you upload, we start creating the archive.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-sm font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium text-[#1C1917]">Archive ready in minutes</h3>
                <p className="text-[#78716C] text-sm">Background processing means no waiting around.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-sm font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium text-[#1C1917]">Download anytime</h3>
                <p className="text-[#78716C] text-sm">You or your client can download the ZIP with one click.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1C1917] mb-6">Perfect For</h2>
          <ul className="space-y-3 text-[#78716C]">
            <li className="flex items-start gap-3">
              <span className="text-amber-500 mt-1">•</span>
              <span><strong className="text-[#1C1917]">Wedding photographers</strong> delivering hundreds of images</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-500 mt-1">•</span>
              <span><strong className="text-[#1C1917]">Portrait photographers</strong> who want easy client delivery</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-500 mt-1">•</span>
              <span><strong className="text-[#1C1917]">Event photographers</strong> with tight turnaround times</span>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="pt-4">
          <div className="p-8 rounded-2xl bg-[#1C1917] text-white text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to simplify delivery?</h3>
            <p className="text-white/70 mb-6">Start creating galleries with automatic backups today.</p>
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
