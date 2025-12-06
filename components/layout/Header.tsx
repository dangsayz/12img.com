'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UsageBadge } from './UsageBadge'
import type { LegacyPlanId } from '@/lib/config/pricing'

interface HeaderProps {
  userPlan?: LegacyPlanId | string
  galleryCount?: number
  imageCount?: number
}

export function Header({ userPlan = 'free', galleryCount = 0, imageCount = 0 }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl border border-[#E8E4DC] rounded-2xl px-6 py-3 shadow-sm">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1C1917] flex items-center justify-center text-white font-bold text-xs">
                12
              </div>
              <span className="text-[17px] font-semibold text-[#1C1917]">img</span>
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3] transition-all"
              >
                Galleries
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3] transition-all"
              >
                Settings
              </Link>
            </nav>
          </div>

          {/* Center: Usage Badge */}
          <UsageBadge 
            plan={userPlan} 
            galleryCount={galleryCount} 
            imageCount={imageCount} 
          />

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Create Action */}
            <Link href="/upload" className="md:hidden">
               <Button size="icon" variant="ghost" className="rounded-lg">
                 <Plus className="h-5 w-5" />
               </Button>
            </Link>

            {/* Desktop Create Action */}
            <Link href="/upload" className="hidden md:block">
              <Button size="sm" className="h-9 rounded-lg bg-[#1C1917] px-4 text-sm font-medium text-white hover:bg-[#292524] transition-all">
                <Plus className="h-4 w-4 mr-1.5" />
                New Gallery
              </Button>
            </Link>

            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
