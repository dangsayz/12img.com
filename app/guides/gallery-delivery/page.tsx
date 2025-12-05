import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import Link from 'next/link'

export const metadata = {
  title: 'Gallery Delivery Guide | 12img',
  description: 'Best practices for delivering client galleries as a wedding photographer.',
}

export default function GalleryDeliveryGuidePage() {
  return (
    <StaticPageLayout
      title="Gallery Delivery Guide"
      subtitle="Best practices for delivering stunning client galleries."
    >
      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">1. Timing Matters</h2>
          <p className="text-[#78716C] leading-relaxed">
            Aim to deliver galleries within 4-6 weeks of the wedding. This keeps the excitement 
            fresh while giving you time to cull and edit thoughtfully. Communicate your timeline 
            upfront so clients know what to expect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">2. Curate Thoughtfully</h2>
          <p className="text-[#78716C] leading-relaxed">
            Quality over quantity. A gallery of 400 carefully selected images has more impact 
            than 1,000 with duplicates. Remove near-identical shots and keep only the best 
            version of each moment.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">3. Organize Your Gallery</h2>
          <p className="text-[#78716C] leading-relaxed">
            Order images chronologically so the gallery tells the story of the day. 
            Start with preparation, move through ceremony, and end with reception highlights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">4. Set Expectations</h2>
          <p className="text-[#78716C] leading-relaxed">
            Include a welcome message explaining how to download images and any usage rights. 
            Password-protect the gallery for privacy and share the password directly with clients.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">5. Follow Up</h2>
          <p className="text-[#78716C] leading-relaxed">
            After delivering, check in to make sure clients can access everything. 
            Ask for reviews and referrals while the experience is still positive.
          </p>
        </section>

        <section className="pt-4 border-t border-[#E8E4DC]">
          <p className="text-[#78716C]">
            Ready to deliver your next gallery?{' '}
            <Link href="/sign-up" className="text-amber-600 hover:underline">
              Start for free
            </Link>
          </p>
        </section>
      </div>
    </StaticPageLayout>
  )
}
