'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, ChevronDown, ArrowRight, Upload, Lock, Shield, Zap, Check, Instagram } from 'lucide-react'

// --- Landing Page Component ---

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#141414] font-sans selection:bg-black selection:text-white">
      
      {/* --- Navigation --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F7]/95 backdrop-blur-sm border-b border-[#E5E5E5]">
        <div className="max-w-[1400px] mx-auto px-6 h-[72px] flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-50">
            <div className="w-8 h-8 bg-black flex items-center justify-center text-white font-bold text-xs tracking-tighter">
              12
            </div>
            <span className="font-serif text-xl font-medium tracking-tight">img</span>
          </Link>

          {/* Desktop Nav Center */}
          <div className="hidden md:flex items-center gap-8">
            <div className="group relative cursor-pointer py-6">
              <span className="text-sm font-medium flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                Product <ChevronDown className="w-3 h-3" />
              </span>
              {/* Dropdown Placeholder */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-white border border-[#E5E5E5] opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 shadow-xl p-2 z-50">
                <Link href="#" className="block px-4 py-2 text-sm hover:bg-[#F5F5F7]">Client Galleries</Link>
                <Link href="#" className="block px-4 py-2 text-sm hover:bg-[#F5F5F7]">Zip Backup</Link>
                <Link href="#" className="block px-4 py-2 text-sm hover:bg-[#F5F5F7] text-gray-400 cursor-not-allowed">AI Culling (Soon)</Link>
              </div>
            </div>
            <div className="group relative cursor-pointer py-6">
              <span className="text-sm font-medium flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                Resources <ChevronDown className="w-3 h-3" />
              </span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-white border border-[#E5E5E5] opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 shadow-xl p-2 z-50">
                <Link href="#" className="block px-4 py-2 text-sm hover:bg-[#F5F5F7]">Blog</Link>
                <Link href="#" className="block px-4 py-2 text-sm hover:bg-[#F5F5F7]">Help Center</Link>
              </div>
            </div>
            <Link href="#pricing" className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity">Pricing</Link>
            <Link href="/view-reel/demo" className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity">Sample Galleries</Link>
          </div>

          {/* Desktop Nav Right */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/sign-in" className="text-sm font-medium hover:underline">Log in</Link>
            <Link href="/sign-up" className="bg-[#141414] text-white text-sm font-medium px-6 py-2.5 hover:bg-black transition-colors rounded-[2px]">
              Start free
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden z-50 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-[#F5F5F7] z-40 pt-24 px-6 md:hidden overflow-y-auto">
            <div className="flex flex-col gap-6 text-xl font-serif">
              <Link href="#" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-200 pb-4">Product</Link>
              <Link href="#" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-200 pb-4">Resources</Link>
              <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-200 pb-4">Pricing</Link>
              <Link href="/view-reel/demo" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-200 pb-4">Sample Galleries</Link>
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)} className="pb-4">Log in</Link>
              <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)} className="bg-[#141414] text-white text-center py-4 mt-4 font-sans font-medium rounded-[2px]">
                Start free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* --- 1. Hero Section --- */}
      <section className="pt-28 pb-12 md:pt-32 md:pb-16 lg:pt-48 lg:pb-32 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-12 gap-8 lg:gap-24">
          
          {/* Text Column */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[56px] leading-[1.1] text-[#141414] mb-6 lg:mb-8">
              Deliver Galleries Faster. <br />
              <span className="italic font-light">Keep More Profit.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#525252] leading-relaxed mb-8 lg:mb-10 max-w-md">
              12IMG is the lean, mobile-first gallery platform for modern photographers. 
              Beautiful delivery, automated backups, and 40% more affordable than the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up" className="bg-[#141414] text-white px-8 py-4 text-center font-bold hover:bg-black transition-colors rounded-[2px] min-w-[160px]">
                Start free
              </Link>
              <Link href="/view-reel/demo" className="bg-transparent border border-[#141414] text-[#141414] px-8 py-4 text-center font-bold hover:bg-[#141414] hover:text-white transition-colors rounded-[2px] min-w-[160px]">
                View sample
              </Link>
            </div>
          </div>

          {/* Visual Column */}
          <div className="lg:col-span-7 relative">
            <div className="relative z-10 bg-white p-2 shadow-2xl border border-gray-100 aspect-[4/3] w-full max-w-[700px] ml-auto">
               <div className="relative w-full h-full bg-gray-100 overflow-hidden">
                 <Image 
                   src="/images/showcase/modern-wedding-gallery-01.jpg" 
                   alt="Gallery Dashboard" 
                   fill 
                   className="object-cover"
                   priority
                 />
               </div>
            </div>
            {/* Overlapping Element */}
            <div className="absolute -bottom-12 -left-4 lg:-left-12 z-20 w-48 h-64 bg-white p-2 shadow-xl border border-gray-100 hidden sm:block">
              <div className="relative w-full h-full bg-gray-100 overflow-hidden">
                <Image 
                   src="/images/showcase/modern-wedding-gallery-02.jpg" 
                   alt="Mobile View" 
                   fill 
                   className="object-cover"
                 />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. Migration Section --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-white border-t border-[#E5E5E5]">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-8 lg:gap-32 items-center">
          
          <div className="order-2 lg:order-1 relative h-[300px] sm:h-[400px] lg:h-[500px] bg-[#F5F5F7] w-full border border-[#E5E5E5]">
            <div className="absolute inset-8 border border-[#E5E5E5] bg-white p-2 shadow-sm">
              <div className="relative w-full h-full overflow-hidden bg-gray-50">
                <Image 
                  src="/images/showcase/modern-wedding-gallery-04.jpg" 
                  alt="Migration Dashboard" 
                  fill 
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4 lg:mb-6">
              Switch in a weekend, <br />
              keep your brand.
            </h2>
            <p className="text-[#525252] text-lg leading-relaxed mb-8">
              Moving to 12IMG is simple. Our tools help you transfer your client data and active galleries without downtime. Keep your custom domain and your brand integrity.
            </p>
            <Link href="#" className="text-[#141414] font-medium border-b border-[#141414] pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors">
              Learn about migration
            </Link>
          </div>

        </div>
      </section>

      {/* --- 3. Client Galleries Experience --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#F5F5F7]">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-8 lg:gap-32 items-center">
          
          {/* Left: Visual */}
          <div className="relative">
             <div className="aspect-[3/4] max-w-[320px] sm:max-w-[400px] lg:max-w-[500px] bg-white p-2 shadow-xl border border-gray-100 mx-auto lg:mr-auto">
               <div className="w-full h-full bg-gray-50 overflow-hidden relative">
                  <Image 
                     src="/images/showcase/modern-wedding-gallery-03.jpg" 
                     alt="Mobile Gallery" 
                     fill 
                     className="object-cover"
                   />
               </div>
             </div>
          </div>

          {/* Right: Copy */}
          <div>
            <div className="inline-block px-3 py-1 border border-[#141414] text-xs font-medium uppercase tracking-wider mb-6">
              Client Experience
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4 lg:mb-6">
              Designed for the mobile generation.
            </h2>
            <p className="text-[#525252] text-lg leading-relaxed mb-8">
              Your clients view 80% of your work on their phones. 12IMG is built mobile-first, ensuring your images look stunning on any screen size without awkward cropping or slow load times.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5" />
                <span className="text-[#525252]">Smart image grouping, no generic masonry</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5" />
                <span className="text-[#525252]">Instant touch interactions</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5" />
                <span className="text-[#525252]">Crisp, full-bleed mobile layouts</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* --- 4. Auto Zip & Backups --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-white border-y border-[#E5E5E5]">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-8 lg:gap-32 items-center">
          
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4 lg:mb-6">
              Automatic Zip Backups. <br />
              <span className="text-[#525252] italic">Peace of mind included.</span>
            </h2>
            <p className="text-[#525252] text-lg leading-relaxed mb-6">
              Every time you upload a gallery, 12IMG automatically generates a ZIP archive and emails a download link to you. 
            </p>
            <p className="text-[#525252] text-lg leading-relaxed mb-8">
              It’s a failsafe backup that lives in your inbox, ensuring you never lose client deliverables even if you accidentally delete a gallery.
            </p>
          </div>

          <div className="h-[250px] sm:h-[300px] lg:h-[400px] bg-[#F5F5F7] border border-[#E5E5E5] flex items-center justify-center p-6 sm:p-12">
             <div className="flex items-center gap-3 sm:gap-6 opacity-60">
                <div className="w-14 h-20 sm:w-24 sm:h-32 border-2 border-[#141414] flex items-center justify-center">
                  <Upload className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6" />
                <div className="w-14 h-20 sm:w-24 sm:h-32 border-2 border-[#141414] flex items-center justify-center bg-[#141414] text-white">
                  <span className="font-bold text-[10px] sm:text-xs">ZIP</span>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6" />
                <div className="w-14 h-20 sm:w-24 sm:h-32 border-2 border-[#141414] flex items-center justify-center rounded-full border-dashed">
                  <span className="text-[10px] sm:text-xs font-serif">Email</span>
                </div>
             </div>
          </div>

        </div>
      </section>

      {/* --- 5. Slideshows (Future) --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#141414] text-white text-center">
        <div className="max-w-[1280px] mx-auto">
          <span className="inline-block px-3 py-1 border border-white/30 text-xs font-medium uppercase tracking-wider mb-8">
            Coming Soon
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] mb-8">
            Cinematic Slideshows
          </h2>
          <div className="relative aspect-video max-w-[900px] mx-auto bg-[#222] border border-white/10 flex items-center justify-center">
             <span className="font-serif italic text-2xl text-white/40">Video Player Placeholder</span>
             {/* Decorative Elements */}
             <div className="absolute bottom-8 left-8 right-8 h-1 bg-white/20">
               <div className="w-1/3 h-full bg-white"></div>
             </div>
          </div>
        </div>
      </section>

      {/* --- 6. Features Grid --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#F5F5F7]">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {[
              { icon: Zap, title: "Fast on Mobile", desc: "Optimized for speed. Your galleries load instantly on 4G and 5G networks." },
              { icon: Shield, title: "Secure Storage", desc: "Enterprise-grade encryption and redundancy for your precious images." },
              { icon: Lock, title: "Your Branding", desc: "Remove our logo, add yours. Custom domains and color palettes included." },
              { icon: Check, title: "Made by Creatives", desc: "Built by working photographers who understand your daily workflow." }
            ].map((feature, i) => (
              <div key={i} className="border border-[#E5E5E5] bg-white p-8 h-full hover:border-[#141414] transition-colors duration-300">
                <feature.icon className="w-6 h-6 mb-6 text-[#141414]" />
                <h3 className="font-serif text-xl mb-3">{feature.title}</h3>
                <p className="text-[#525252] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* --- 7. Social Proof --- */}
      <section className="py-12 md:py-20 px-4 sm:px-6 border-t border-[#E5E5E5] bg-white">
        <div className="max-w-[1280px] mx-auto text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-[#525252] mb-12">Trusted by 10,000+ Photographers</p>
          <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-40 grayscale">
            {/* Logo Placeholders */}
            <div className="h-8 w-32 bg-black/10"></div>
            <div className="h-8 w-32 bg-black/10"></div>
            <div className="h-8 w-32 bg-black/10"></div>
            <div className="h-8 w-32 bg-black/10"></div>
            <div className="h-8 w-32 bg-black/10"></div>
          </div>
        </div>
      </section>

      {/* --- 8. Pricing Preview --- */}
      <section id="pricing" className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#F5F5F7]">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-8 lg:mb-16">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4">Simple, honest pricing.</h2>
            <p className="text-[#525252] text-lg">No hidden fees. Change plans anytime.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {/* Free */}
            <div className="bg-white p-4 sm:p-6 border border-[#E5E5E5] flex flex-col">
              <h3 className="font-serif text-xl mb-1">Free</h3>
              <p className="text-xs text-gray-500 mb-4">Test drive</p>
              <div className="text-3xl font-bold mb-6">$0<span className="text-sm font-normal text-gray-500">/mo</span></div>
              
              <Link href="/sign-up" className="block w-full py-2.5 border border-[#E5E5E5] text-sm font-medium hover:border-[#141414] transition-colors rounded-[2px] text-center mb-6">
                Start free
              </Link>

              <ul className="text-left space-y-2 flex-1">
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> 2GB storage
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> Up to 1,300 images
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> 3 galleries
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> 7-day gallery expiry
                </li>
              </ul>
            </div>

            {/* Essential */}
            <div className="bg-white p-4 sm:p-6 border border-[#E5E5E5] flex flex-col">
              <h3 className="font-serif text-xl mb-1">Essential</h3>
              <p className="text-xs text-gray-500 mb-4">For part-time photographers</p>
              <div className="text-3xl font-bold mb-6">$6<span className="text-sm font-normal text-gray-500">/mo</span></div>
              
              <Link href="/sign-up" className="block w-full py-2.5 border border-[#E5E5E5] text-sm font-medium hover:border-[#141414] transition-colors rounded-[2px] text-center mb-6">
                Get Essential
              </Link>

              <ul className="text-left space-y-2 flex-1">
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> 10GB storage
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> Up to 4,000 images
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> Unlimited galleries
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> Galleries never expire
                </li>
              </ul>
            </div>
            
            {/* Pro - Recommended */}
            <div className="bg-[#141414] text-white p-4 sm:p-6 border border-[#141414] flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-[#141414] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border border-[#141414]">
                Most Popular
              </div>
              <h3 className="font-serif text-xl mb-1">Pro</h3>
              <p className="text-xs text-white/60 mb-4">Most popular</p>
              <div className="text-3xl font-bold mb-6">$12<span className="text-sm font-normal text-white/60">/mo</span></div>
              
              <Link href="/sign-up" className="block w-full py-2.5 bg-white text-[#141414] text-sm font-medium hover:bg-gray-100 transition-colors rounded-[2px] text-center mb-6">
                Get Pro
              </Link>

              <ul className="text-left space-y-2 flex-1">
                <li className="flex items-start gap-2 text-xs text-white/80">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" /> 100GB storage
                </li>
                <li className="flex items-start gap-2 text-xs text-white/80">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" /> Up to 31,000 images
                </li>
                <li className="flex items-start gap-2 text-xs text-white/80">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" /> Unlimited galleries
                </li>
                <li className="flex items-start gap-2 text-xs text-white/80">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" /> Galleries never expire
                </li>
              </ul>
            </div>

            {/* Studio */}
            <div className="bg-white p-4 sm:p-6 border border-[#E5E5E5] flex flex-col">
              <h3 className="font-serif text-xl mb-1">Studio</h3>
              <p className="text-xs text-gray-500 mb-4">For busy studios</p>
              <div className="text-3xl font-bold mb-6">$18<span className="text-sm font-normal text-gray-500">/mo</span></div>
              
              <Link href="/sign-up" className="block w-full py-2.5 border border-[#E5E5E5] text-sm font-medium hover:border-[#141414] transition-colors rounded-[2px] text-center mb-6">
                Get Studio
              </Link>

              <ul className="text-left space-y-2 flex-1">
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> 500GB storage
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> Up to 151,000 images
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> Unlimited galleries
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> Priority Support
                </li>
              </ul>
            </div>

            {/* Elite */}
            <div className="bg-white p-4 sm:p-6 border border-[#E5E5E5] flex flex-col">
              <h3 className="font-serif text-xl mb-1">Elite</h3>
              <p className="text-xs text-gray-500 mb-4">For power users</p>
              <div className="text-3xl font-bold mb-6">$30<span className="text-sm font-normal text-gray-500">/mo</span></div>
              
              <Link href="/sign-up" className="block w-full py-2.5 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors rounded-[2px] text-center mb-6">
                Get Elite
              </Link>

              <ul className="text-left space-y-2 flex-1">
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> 2TB storage
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> Up to 600,000 images
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> Unlimited galleries
                </li>
                <li className="flex items-start gap-2 text-xs text-[#525252]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> Priority support
                </li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/pricing" className="text-sm font-medium border-b border-[#141414] pb-0.5 hover:text-gray-600 transition-colors">
              View full pricing comparison
            </Link>
          </div>
        </div>
      </section>

      {/* --- 9. Final CTA --- */}
      <section className="py-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-white border-t border-[#E5E5E5] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[52px] leading-tight mb-6 lg:mb-8">
            Ready to send your next <br /> gallery with 12IMG?
          </h2>
          <p className="text-lg text-[#525252] mb-10">
            Join thousands of photographers who have simplified their workflow.
          </p>
          <Link href="/sign-up" className="inline-block bg-[#141414] text-white px-10 py-4 text-center font-medium hover:bg-black transition-colors rounded-[2px] min-w-[200px]">
            Start for free
          </Link>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-[#141414] text-white/60 py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-1">
             <div className="flex items-center gap-2 mb-6 text-white">
                <div className="w-6 h-6 bg-white flex items-center justify-center text-black font-bold text-[10px] tracking-tighter">
                  12
                </div>
                <span className="font-serif text-lg font-medium tracking-tight">img</span>
             </div>
             <p className="text-sm leading-relaxed mb-6">
               Minimal gallery delivery for professional photographers.
             </p>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Client Galleries</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Sample Galleries</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6">Resources</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6">Social</h4>
            <div className="flex gap-4">
               {/* Social Icons */}
               <Link href="https://instagram.com/12img" target="_blank" className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors rounded-full">
                 <Instagram className="w-4 h-4 text-white" />
               </Link>
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-20 pt-8 border-t border-white/10 text-xs flex justify-between">
           <p>© {new Date().getFullYear()} 12IMG. All rights reserved.</p>
           <p>Made for photographers.</p>
        </div>
      </footer>

    </div>
  )
}
