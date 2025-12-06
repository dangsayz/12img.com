'use client'

import Link from 'next/link'
import Image from 'next/image'
// Custom lightweight icons
const IconZap = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

const IconArrowRight = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const IconCheck = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
)

const IconUpload = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V3M12 3l-4 4M12 3l4 4" />
    <path d="M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2" />
  </svg>
)

const IconLock = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" />
  </svg>
)

const IconDownload = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M12 15l-4-4M12 15l4-4" />
    <path d="M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2" />
  </svg>
)

const IconMail = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6l-10 7L2 6" />
  </svg>
)

const IconShield = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 4v5c0 5.5-3.5 8.5-8 10-4.5-1.5-8-4.5-8-10V7l8-4z" />
  </svg>
)
import { PLANS } from '@/lib/config/pricing'

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F3]">
      {/* Clean Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between bg-white/90 backdrop-blur-sm border border-[#E8E4DC] rounded-2xl px-5 py-3 shadow-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1C1917] flex items-center justify-center text-white text-xs font-bold">
                12
              </div>
              <span className="text-[17px] font-semibold text-[#1C1917]">img</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link 
                href="/sign-in" 
                className="text-sm font-medium text-[#78716C] hover:text-[#1C1917] transition-colors hidden sm:block px-3 py-2"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up"
                className="text-sm font-semibold text-white bg-[#1C1917] hover:bg-[#292524] px-5 py-2.5 rounded-xl transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean & Simple */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-6">
                <IconZap className="w-4 h-4" />
                For Photographers
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1C1917] leading-[1.1] mb-6">
                Share your work,
                <span className="block text-amber-500">beautifully.</span>
              </h1>
              
              <p className="text-lg text-[#78716C] mb-8 leading-relaxed max-w-lg">
                Ultra-minimal client galleries. No clutter. Just your images presented in a cinematic, distraction-free environment.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link 
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1C1917] text-white font-semibold rounded-xl hover:bg-[#292524] transition-colors"
                >
                  Get Started <IconArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  href="/g/demo"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-[#1C1917] font-semibold rounded-xl border border-[#E8E4DC] hover:border-[#1C1917] transition-colors"
                >
                  View Demo
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#78716C]">
                <span className="flex items-center gap-2">
                  <IconCheck className="w-4 h-4 text-emerald-500" /> Free to start
                </span>
                <span className="flex items-center gap-2">
                  <IconCheck className="w-4 h-4 text-emerald-500" /> No credit card
                </span>
                <span className="flex items-center gap-2">
                  <IconCheck className="w-4 h-4 text-emerald-500" /> Setup in 30 seconds
                </span>
              </div>
            </div>

            {/* Right: App Preview Card */}
            <div className="relative">
              <div className="bg-white rounded-3xl border border-[#E8E4DC] shadow-xl overflow-hidden">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E8E4DC] bg-[#FAFAF9]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-md border border-[#E8E4DC] text-xs text-[#78716C]">
                      <IconLock className="w-3 h-3" />
                      12img.com/g/wedding
                    </div>
                  </div>
                </div>
                
                {/* Gallery Preview */}
                <div className="p-4 bg-[#FAF8F3]">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 row-span-2 aspect-[4/3] relative rounded-xl overflow-hidden bg-stone-200">
                      <Image 
                        src="/images/showcase/modern-wedding-gallery-01.jpg" 
                        alt="Gallery preview" 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-stone-200">
                      <Image 
                        src="/images/showcase/modern-wedding-gallery-02.jpg" 
                        alt="Gallery preview" 
                        fill 
                        className="object-cover"
                        sizes="25vw"
                      />
                    </div>
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-stone-200">
                      <Image 
                        src="/images/showcase/modern-wedding-gallery-03.jpg" 
                        alt="Gallery preview" 
                        fill 
                        className="object-cover"
                        sizes="25vw"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Card */}
              <div className="absolute -left-4 bottom-8 bg-white rounded-2xl p-4 shadow-lg border border-[#E8E4DC] hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <IconZap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#78716C]">Upload speed</p>
                    <p className="text-sm font-bold text-[#1C1917]">2.4 seconds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Refined */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-600 text-sm font-medium tracking-wide uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] mb-4">
              Everything you need
            </h2>
            <p className="text-[#78716C] text-lg max-w-md mx-auto">
              Simple tools that let your photography shine
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: IconUpload, title: 'Fast Uploads', desc: 'Drag and drop hundreds of photos. They upload in seconds, not minutes.', gradient: 'from-amber-500 to-orange-500' },
              { icon: IconLock, title: 'Password Protection', desc: 'Keep galleries private with simple PIN or password protection.', gradient: 'from-emerald-500 to-teal-500' },
              { icon: IconDownload, title: 'Easy Downloads', desc: 'Clients download individual photos or the entire gallery as ZIP.', gradient: 'from-sky-500 to-blue-500' },
              { icon: IconMail, title: 'Email Delivery', desc: 'Send gallery links directly to clients with one click.', gradient: 'from-violet-500 to-purple-500' },
              { icon: IconShield, title: 'Secure Storage', desc: 'Your photos are stored safely with enterprise-grade security.', gradient: 'from-rose-500 to-pink-500' },
              { icon: IconZap, title: 'Lightning Fast', desc: 'Optimized delivery means galleries load instantly on any device.', gradient: 'from-orange-500 to-amber-500' },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group relative bg-white rounded-2xl p-6 border border-[#E8E4DC]/80 hover:border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)]"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#1C1917] mb-2">{feature.title}</h3>
                <p className="text-[#78716C] text-[14px] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof - Simple Stats */}
      <section className="py-16 px-4 bg-[#1C1917]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">10K+</p>
              <p className="text-white/50 text-sm mt-1">Photographers</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">2.5M</p>
              <p className="text-white/50 text-sm mt-1">Photos Delivered</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">99.9%</p>
              <p className="text-white/50 text-sm mt-1">Uptime</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <p className="text-3xl sm:text-4xl font-bold text-white">4.9</p>
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-white/50 text-sm mt-1">Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Refined */}
      <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-[#FAF8F3] via-white to-[#FAF8F3]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <p className="text-amber-600 text-sm font-medium tracking-wide uppercase mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-[#78716C] text-lg max-w-md mx-auto">
              Just storage and images. No hidden fees.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`relative rounded-2xl p-5 transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-[#1C1917] text-white scale-[1.02] shadow-2xl shadow-stone-900/20' 
                    : 'bg-white border border-[#E8E4DC] hover:border-stone-300 hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-[#1C1917] text-[10px] font-bold rounded-full whitespace-nowrap shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <h3 className={`text-[15px] font-semibold mb-0.5 ${plan.popular ? 'text-white' : 'text-[#1C1917]'}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs mb-4 ${plan.popular ? 'text-white/60' : 'text-[#78716C]'}`}>
                  {plan.description}
                </p>
                
                <div className="mb-5">
                  {plan.monthlyPrice === 0 ? (
                    <span className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-[#1C1917]'}`}>Free</span>
                  ) : (
                    <>
                      <span className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-[#1C1917]'}`}>
                        ${plan.monthlyPrice}
                      </span>
                      <span className={`text-xs ${plan.popular ? 'text-white/60' : 'text-[#78716C]'}`}>/mo</span>
                    </>
                  )}
                </div>

                <Link 
                  href={`/sign-up?plan=${plan.id}`}
                  className={`block w-full text-center py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-200 mb-5 ${
                    plan.popular
                      ? 'bg-white text-[#1C1917] hover:bg-stone-100 shadow-lg'
                      : 'bg-[#1C1917] text-white hover:bg-[#292524]'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-2.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className={`flex items-start gap-2 text-[12px] leading-snug ${
                      plan.popular ? 'text-white/80' : 'text-[#57534E]'
                    }`}>
                      <IconCheck className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                        plan.popular ? 'text-emerald-400' : 'text-emerald-500'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Simple note */}
          <p className="text-center text-[13px] text-[#A8A29E] mt-10">
            All plans include password protection, download options, and mobile-optimized galleries.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-[#1C1917]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-white/60 mb-8">
            Join thousands of photographers who trust 12img for their gallery delivery.
          </p>
          <Link 
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1C1917] font-semibold rounded-xl hover:bg-stone-100 transition-colors"
          >
            Start for free <IconArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
