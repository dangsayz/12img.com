import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import { Mail, MessageCircle } from 'lucide-react'

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

export default function HelpPage() {
  return (
    <StaticPageLayout
      title="Help Center"
      subtitle="Everything you need to know about using 12img"
    >
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
    </StaticPageLayout>
  )
}
