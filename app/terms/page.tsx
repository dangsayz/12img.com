import { StaticPageLayout } from '@/components/layout/StaticPageLayout'

export const metadata = {
  title: 'Terms of Service | 12img',
  description: 'Terms and conditions for using 12img gallery platform.',
}

export default function TermsPage() {
  return (
    <StaticPageLayout
      title="Terms of Service"
      subtitle="Last updated: December 2024"
    >
      <div className="space-y-8">
        <p className="text-[#78716C] leading-relaxed">
          By using 12img, you agree to these terms. Please read them carefully.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">1. The Service</h2>
          <p className="text-[#78716C] leading-relaxed">
            12img provides a platform for photographers to create and share client galleries. 
            We reserve the right to modify or discontinue features with reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">2. Your Account</h2>
          <ul className="space-y-2 text-[#78716C]">
            <li>You must be 18+ to use this service</li>
            <li>You are responsible for maintaining account security</li>
            <li>One person or business per account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">3. Acceptable Use</h2>
          <p className="text-[#78716C] mb-3">You agree NOT to:</p>
          <ul className="space-y-2 text-[#78716C]">
            <li>Upload illegal or harmful content</li>
            <li>Infringe on others' intellectual property</li>
            <li>Share content you don't have rights to</li>
            <li>Use the service for spam or harassment</li>
            <li>Attempt to breach our security</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">4. Your Content</h2>
          <p className="text-[#78716C] leading-relaxed">
            You retain full ownership of photos you upload. By using our service, you grant us 
            a limited license to store, display, and transmit your content as needed to provide 
            the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">5. Payment & Refunds</h2>
          <ul className="space-y-2 text-[#78716C]">
            <li>Paid plans are billed monthly or annually</li>
            <li>You can cancel anytime; access continues until period ends</li>
            <li>Refunds are provided at our discretion</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">6. Liability</h2>
          <p className="text-[#78716C] leading-relaxed">
            We provide 12img "as is" without warranties. We are not liable for data loss, 
            though we take reasonable precautions to protect your content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">7. Changes to Terms</h2>
          <p className="text-[#78716C] leading-relaxed">
            We may update these terms. Continued use after changes means you accept them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Contact</h2>
          <p className="text-[#78716C]">
            Questions? Email us at{' '}
            <a href="mailto:legal@12img.com" className="text-amber-600 hover:underline">legal@12img.com</a>
          </p>
        </section>
      </div>
    </StaticPageLayout>
  )
}
