import { StaticPageLayout } from '@/components/layout/StaticPageLayout'

export const metadata = {
  title: 'Privacy Policy | 12img',
  description: 'How 12img collects, uses, and protects your information.',
}

export default function PrivacyPage() {
  return (
    <StaticPageLayout
      title="Privacy Policy"
      subtitle="Last updated: December 2024"
    >
      <div className="space-y-8">
        <p className="text-[#78716C] leading-relaxed">
          At 12img, we take your privacy seriously. This policy explains how we collect, 
          use, and protect your information when you use our gallery sharing service.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Information We Collect</h2>
          <ul className="space-y-2 text-[#78716C]">
            <li><strong className="text-[#1C1917]">Account Information</strong> – Email address and name when you sign up</li>
            <li><strong className="text-[#1C1917]">Gallery Content</strong> – Photos you upload to share with clients</li>
            <li><strong className="text-[#1C1917]">Usage Data</strong> – How you interact with our service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">How We Use Your Information</h2>
          <ul className="space-y-2 text-[#78716C]">
            <li>To provide and maintain our gallery service</li>
            <li>To notify you about changes to our service</li>
            <li>To provide customer support</li>
            <li>To detect and prevent technical issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Data Storage & Security</h2>
          <p className="text-[#78716C] leading-relaxed">
            Your photos are stored securely on Supabase infrastructure. We use industry-standard 
            encryption for data in transit and at rest. Password-protected galleries use secure 
            hashing algorithms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Data Sharing</h2>
          <p className="text-[#78716C] leading-relaxed mb-3">
            We do not sell your personal information. We only share data with:
          </p>
          <ul className="space-y-2 text-[#78716C]">
            <li><strong className="text-[#1C1917]">Service Providers</strong> – Supabase (hosting), Clerk (authentication)</li>
            <li><strong className="text-[#1C1917]">Legal Requirements</strong> – When required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Your Rights</h2>
          <ul className="space-y-2 text-[#78716C]">
            <li>Access and download your data</li>
            <li>Delete your account and all associated data</li>
            <li>Update your information at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-3">Contact</h2>
          <p className="text-[#78716C]">
            Questions? Email us at{' '}
            <a href="mailto:privacy@12img.com" className="text-amber-600 hover:underline">privacy@12img.com</a>
          </p>
        </section>
      </div>
    </StaticPageLayout>
  )
}
