import Link from 'next/link'
import { ReactNode } from 'react'
import { PublicNav } from './PublicNav'

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
    <main className="min-h-screen bg-[#F5F5F7]">
      {/* Shared Public Nav */}
      <PublicNav />

      {/* Content */}
      <div className="pt-24 pb-24 px-4 sm:px-6">
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
      <footer className="border-t border-stone-200 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-stone-900 flex items-center justify-center">
              <span className="text-white font-bold text-[8px] tracking-tight">12</span>
            </div>
            <span className="text-sm font-bold text-stone-900">img</span>
          </Link>
          <p className="text-sm text-stone-500">
            © {new Date().getFullYear()} 12img. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
