import { StaticPageLayout } from '@/components/layout/StaticPageLayout'

export const metadata = {
  title: 'About Us | 12img',
  description: 'Learn about 12img - the simplest gallery platform for wedding photographers.',
}

export default function AboutPage() {
  return (
    <StaticPageLayout
      title="About Us"
      subtitle="We're building the simplest way to share your photography."
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Our Mission</h2>
          <p className="text-[#78716C] leading-relaxed">
            Wedding photographers shouldn't pay $300+ per year just to share galleries with clients. 
            We built 12img to be fast, beautiful, and affordable—so you can keep more of what you earn.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Why 12img?</h2>
          <p className="text-[#78716C] leading-relaxed mb-4">
            We believe gallery delivery should be simple:
          </p>
          <ul className="space-y-2 text-[#78716C]">
            <li><strong className="text-[#1C1917]">Fast</strong> – Upload hundreds of photos in seconds</li>
            <li><strong className="text-[#1C1917]">Secure</strong> – Password protection built-in</li>
            <li><strong className="text-[#1C1917]">Beautiful</strong> – Your photos, showcased perfectly</li>
            <li><strong className="text-[#1C1917]">Affordable</strong> – From $0/month</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">The Team</h2>
          <p className="text-[#78716C] leading-relaxed">
            We're a small team of designers and developers who've worked with photographers 
            and understand the frustration of overpriced gallery platforms. 12img is our answer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Get in Touch</h2>
          <p className="text-[#78716C]">
            Questions or feedback? Email us at{' '}
            <a href="mailto:hello@12img.com" className="text-amber-600 hover:underline">hello@12img.com</a>
          </p>
        </section>
      </div>
    </StaticPageLayout>
  )
}
