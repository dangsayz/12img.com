'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface StaticPageLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  backLabel?: string
  backHref?: string
}

export function StaticPageLayout({ 
  title, 
  subtitle, 
  children,
  backLabel = 'Back to home',
  backHref = '/'
}: StaticPageLayoutProps) {
  return (
    <main className="min-h-screen bg-[#FAF8F3]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-2xl border border-[#E8E4DC] rounded-2xl px-6 py-3 shadow-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1C1917] flex items-center justify-center text-white text-xs font-bold">
                12
              </div>
              <span className="text-[17px] font-semibold text-[#1C1917]">img</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                href="/sign-in" 
                className="text-sm font-medium text-[#78716C] hover:text-[#1C1917] transition-colors hidden sm:block"
              >
                Sign in
              </Link>
              <Link 
                href="/sign-up"
                className="text-sm font-semibold text-white bg-[#1C1917] hover:bg-[#292524] px-5 py-2.5 rounded-xl transition-all hover:scale-105"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link 
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </Link>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1C1917] tracking-tight mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-[#78716C]">
                {subtitle}
              </p>
            )}
          </header>

          {/* Body */}
          <article className="prose prose-stone prose-lg max-w-none">
            {children}
          </article>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="border-t border-[#E8E4DC] py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#1C1917] flex items-center justify-center text-white text-[10px] font-bold">
              12
            </div>
            <span className="text-sm font-semibold text-[#1C1917]">img</span>
          </Link>
          <p className="text-sm text-[#78716C]">
            © {new Date().getFullYear()} 12img. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
