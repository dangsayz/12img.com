import { StaticPageLayout } from '@/components/layout/StaticPageLayout'

export const metadata = {
  title: 'Gallery Features | 12img',
  description: 'Explore all the features that make 12img the best gallery platform for wedding photographers.',
}

export default function FeaturesPage() {
  return (
    <StaticPageLayout
      title="Gallery Features"
      subtitle="Everything you need to deliver stunning client galleries."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold text-[#1C1917] mb-4">Fast Uploads</h2>
          <p className="text-[#78716C] leading-relaxed">
            Upload hundreds of high-resolution images in seconds, not minutes. Our optimized infrastructure ensures your galleries are ready to share faster than ever.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#1C1917] mb-4">Password Protection</h2>
          <p className="text-[#78716C] leading-relaxed">
            Keep your client galleries private with simple password protection. Share the password with your clients and rest easy knowing their photos are secure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#1C1917] mb-4">One-Click Downloads</h2>
          <p className="text-[#78716C] leading-relaxed">
            Your clients can download individual images or the entire gallery with a single click. No complicated interfaces, no confusion.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#1C1917] mb-4">Beautiful Presentation</h2>
          <p className="text-[#78716C] leading-relaxed">
            Your work deserves to be showcased beautifully. Our minimalist gallery design puts the focus where it belongs—on your photography.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#1C1917] mb-4">Mobile Optimized</h2>
          <p className="text-[#78716C] leading-relaxed">
            Galleries look stunning on any device. Whether your clients view on desktop, tablet, or phone, the experience is seamless.
          </p>
        </section>
      </div>
    </StaticPageLayout>
  )
}
