import type { Metadata } from 'next'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import Link from 'next/link'
import { Image, Share2, Lock, Palette, Smartphone, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Client Galleries — 12img',
  description: 'Beautiful, mobile-first client galleries for wedding and portrait photographers. Fast delivery, password protection, and stunning presentation.',
  openGraph: {
    title: 'Client Galleries — 12img',
    description: 'Beautiful, mobile-first client galleries for wedding and portrait photographers.',
  },
}

const features = [
  {
    icon: Zap,
    title: 'Lightning-Fast Uploads',
    description: 'Upload hundreds of high-resolution images in seconds. Our optimized infrastructure handles large galleries with ease.',
  },
  {
    icon: Share2,
    title: 'Easy Sharing',
    description: 'Generate a unique link for each gallery. Share via email, text, or social media with one click.',
  },
  {
    icon: Lock,
    title: 'Password Protection',
    description: 'Keep galleries private with optional password protection. Only your clients can access their photos.',
  },
  {
    icon: Palette,
    title: 'Beautiful Presentation',
    description: 'Your photos deserve to shine. Our minimalist design puts the focus on your work, not distracting UI.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Galleries look stunning on any device. Optimized for the way clients actually view photos today.',
  },
  {
    icon: Image,
    title: 'Multiple View Modes',
    description: 'Reel view for cinematic presentations, grid view for browsing, and fullscreen for the details.',
  },
]

export default function ClientGalleriesPage() {
  return (
    <StaticPageLayout
      title="Client Galleries"
      subtitle="Beautiful, mobile-first galleries that make your work shine."
      backLabel="Back to features"
      backHref="/features"
    >
      <div className="space-y-12">
        {/* Hero description */}
        <section>
          <p className="text-lg text-[#78716C] leading-relaxed">
            Stop paying $300+/year for gallery delivery. 12img gives you everything you need to 
            share stunning galleries with clients—fast uploads, password protection, and beautiful 
            presentation—at a fraction of the cost.
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
                <h3 className="font-medium text-[#1C1917]">Upload your photos</h3>
                <p className="text-[#78716C] text-sm">Drag and drop or select files. We handle the rest.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-sm font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium text-[#1C1917]">Customize your gallery</h3>
                <p className="text-[#78716C] text-sm">Add a title, set a password, choose your layout.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-sm font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium text-[#1C1917]">Share with your client</h3>
                <p className="text-[#78716C] text-sm">Copy the link and send it. That's it.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pt-4">
          <div className="p-8 rounded-2xl bg-[#1C1917] text-white text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to try it?</h3>
            <p className="text-white/70 mb-6">Create your first gallery in under 2 minutes.</p>
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
