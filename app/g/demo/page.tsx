import { Metadata } from 'next'
import { DemoNav } from '@/components/demo/DemoNav'
import { DemoHero } from '@/components/demo/DemoHero'
import { HowItWorks } from '@/components/demo/HowItWorks'
import { DemoGallery } from '@/components/demo/DemoGallery'
import { BenefitsSection } from '@/components/demo/BenefitsSection'
import { PhotographerSection } from '@/components/demo/PhotographerSection'
import { TestimonialsSection } from '@/components/demo/TestimonialsSection'
import { FAQSection } from '@/components/demo/FAQSection'
import { StickyCTA } from '@/components/demo/StickyCTA'

export const metadata: Metadata = {
  title: 'Live Demo Gallery | 12img',
  description: 'See how 12img delivers beautiful client galleries for wedding photographers. Try the interactive demo — no signup required.',
  openGraph: {
    title: 'Live Demo Gallery | 12img',
    description: 'See how 12img delivers beautiful client galleries for wedding photographers. Try the interactive demo — no signup required.',
    type: 'website',
  },
}

export default function DemoPage() {
  return (
    <>
      {/* Custom Demo Navigation */}
      <DemoNav />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <DemoHero />

        {/* How It Works Timeline */}
        <HowItWorks />

        {/* Interactive Gallery Demo */}
        <DemoGallery />

        {/* Benefits Cards */}
        <BenefitsSection />

        {/* For Photographers Section */}
        <PhotographerSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* FAQ */}
        <FAQSection />

        {/* Sticky CTA */}
        <StickyCTA />
      </main>
    </>
  )
}
