import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import { Mail, Instagram } from 'lucide-react'

export const metadata = {
  title: 'Contact Us | 12img',
  description: 'Get in touch with the 12img team.',
}

export default function ContactPage() {
  return (
    <StaticPageLayout
      title="Contact Us"
      subtitle="We'd love to hear from you."
    >
      <div className="space-y-10">
        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="mailto:twelve12img@gmail.com"
            className="flex items-center gap-4 p-5 rounded-2xl border border-[#E8E4DC] hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
          >
            <div className="p-3 bg-[#FAF8F3] rounded-xl">
              <Mail className="w-5 h-5 text-[#78716C]" />
            </div>
            <div>
              <p className="font-medium text-[#1C1917]">Email</p>
              <p className="text-sm text-[#78716C]">twelve12img@gmail.com</p>
            </div>
          </a>
          <a
            href="https://instagram.com/12images"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl border border-[#E8E4DC] hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
          >
            <div className="p-3 bg-[#FAF8F3] rounded-xl">
              <Instagram className="w-5 h-5 text-[#78716C]" />
            </div>
            <div>
              <p className="font-medium text-[#1C1917]">Instagram</p>
              <p className="text-sm text-[#78716C]">@12images</p>
            </div>
          </a>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-4">Quick Links</h2>
          <ul className="space-y-3 text-[#78716C]">
            <li>
              <strong className="text-[#1C1917]">Email:</strong>{' '}
              <a href="mailto:twelve12img@gmail.com" className="text-amber-600 hover:underline">twelve12img@gmail.com</a>
            </li>
            <li>
              <strong className="text-[#1C1917]">Instagram:</strong>{' '}
              <a href="https://instagram.com/12images" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">@12images</a>
            </li>
          </ul>
        </section>

        <section>
          <p className="text-[#78716C] text-sm">
            We typically respond within 24 hours on business days.
          </p>
        </section>
      </div>
    </StaticPageLayout>
  )
}
