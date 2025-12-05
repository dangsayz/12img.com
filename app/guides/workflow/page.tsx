import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import Link from 'next/link'

export const metadata = {
  title: 'Workflow Tips | 12img',
  description: 'Streamline your photography workflow from shoot to delivery.',
}

export default function WorkflowTipsPage() {
  return (
    <StaticPageLayout
      title="Workflow Tips"
      subtitle="Streamline your process from shoot to delivery."
    >
      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Backup Immediately</h2>
          <p className="text-[#78716C] leading-relaxed">
            Before leaving the venue, copy all cards to a portable drive. At home, follow the 
            3-2-1 rule: 3 copies, 2 different media types, 1 offsite. Never work from your 
            only copy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Cull in Passes</h2>
          <p className="text-[#78716C] leading-relaxed">
            First pass: reject obvious misses (blur, blinks, exposure failures). Second pass: 
            pick your favorites. Third pass: final selection. This prevents decision fatigue 
            and speeds up the process.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Batch Your Editing</h2>
          <p className="text-[#78716C] leading-relaxed">
            Apply global adjustments to similar lighting conditions at once. Use presets as 
            starting points, then fine-tune. Save custom presets for venues you shoot repeatedly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Export Smart</h2>
          <p className="text-[#78716C] leading-relaxed">
            For web galleries, JPEG at 80-85% quality is ideal. Resize to 2400px on the long 
            edge for fast loading while maintaining quality. Keep full-resolution originals 
            for print orders.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Template Your Delivery</h2>
          <p className="text-[#78716C] leading-relaxed">
            Create email templates for gallery delivery, follow-ups, and review requests. 
            Consistent communication saves time and ensures nothing falls through the cracks.
          </p>
        </section>

        <section className="pt-4 border-t border-[#E8E4DC]">
          <p className="text-[#78716C]">
            Speed up your delivery with 12img.{' '}
            <Link href="/sign-up" className="text-amber-600 hover:underline">
              Start for free
            </Link>
          </p>
        </section>
      </div>
    </StaticPageLayout>
  )
}
