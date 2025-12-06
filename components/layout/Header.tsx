'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Plus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UsageBadge } from './UsageBadge'
import type { LegacyPlanId } from '@/lib/config/pricing'

export type UserRole = 'user' | 'support' | 'admin' | 'super_admin'

interface HeaderProps {
  userPlan?: LegacyPlanId | string
  galleryCount?: number
  imageCount?: number
  storageUsed?: number // bytes
  isAuthenticated?: boolean
  userRole?: UserRole
}

export function Header({ 
  userPlan = 'free', 
  galleryCount = 0, 
  imageCount = 0,
  storageUsed = 0,
  isAuthenticated = true,
  userRole = 'user'
}: HeaderProps) {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="flex justify-center">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-[#E8E4DC] rounded-full px-2 py-1.5 shadow-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 pl-1">
            <div className="relative">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#292524] to-[#1C1917] flex items-center justify-center shadow-md shadow-black/10 border border-[#3f3f46]/30">
                <span className="text-white font-black text-[10px] tracking-tighter">12</span>
              </div>
            </div>
            <span className="text-sm font-bold text-[#1C1917]">img</span>
          </Link>
          
          {/* Divider */}
          <div className="w-px h-5 bg-[#E8E4DC]" />
          
          {/* Nav Links */}
          <nav className="flex items-center gap-0.5">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3] transition-all"
            >
              Galleries
            </Link>
            <Link
              href="/pricing"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3] transition-all"
            >
              Pricing
            </Link>
            <Link
              href="/settings"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3] transition-all"
            >
              Settings
            </Link>
          </nav>
          
          {isAuthenticated ? (
            <>
              {/* Divider */}
              <div className="w-px h-5 bg-[#E8E4DC]" />
              
              {/* Usage Badge - Compact */}
              <UsageBadge 
                plan={userPlan} 
                galleryCount={galleryCount} 
                imageCount={imageCount}
                storageUsed={storageUsed}
              />
              
              {/* Divider */}
              <div className="w-px h-5 bg-[#E8E4DC]" />

              {/* New Gallery Button */}
              <Link href="/upload">
                <Button size="sm" className="h-7 rounded-full bg-[#1C1917] px-3 text-xs font-medium text-white hover:bg-[#292524] transition-all">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">New Gallery</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </Link>

              {/* Admin Link - Only for admins */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="p-1.5 rounded-full text-amber-600 hover:bg-amber-50 transition-all"
                  title="Admin Panel"
                >
                  <Shield className="h-4 w-4" />
                </Link>
              )}

              {/* User Button */}
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7"
                  }
                }}
              />
            </>
          ) : (
            <>
              {/* Divider */}
              <div className="w-px h-5 bg-[#E8E4DC]" />
              
              {/* Sign In */}
              <Link
                href="/sign-in"
                className="px-3 py-1.5 rounded-full text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3] transition-all"
              >
                Sign In
              </Link>
              
              {/* Get Started Button */}
              <Link href="/sign-up">
                <Button size="sm" className="h-7 rounded-full bg-[#1C1917] px-3 text-xs font-medium text-white hover:bg-[#292524] transition-all">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
