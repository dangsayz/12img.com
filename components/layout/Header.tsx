'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Plus, Shield, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

const navLinks = [
  { href: '/', label: 'Galleries' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/settings', label: 'Settings' },
]

export function Header({ 
  userPlan = 'free', 
  galleryCount = 0, 
  imageCount = 0,
  storageUsed = 0,
  isAuthenticated = true,
  userRole = 'user'
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 py-2 sm:py-3">
      <div className="flex justify-center">
        <div className="flex items-center justify-between w-full max-w-md sm:w-auto sm:max-w-none gap-2 sm:gap-2 bg-white/95 backdrop-blur-xl border border-[#E8E4DC] rounded-full px-3 sm:px-2 py-2 sm:py-1.5 shadow-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#292524] to-[#1C1917] flex items-center justify-center shadow-md shadow-black/10 border border-[#3f3f46]/30">
              <span className="text-white font-black text-[11px] sm:text-[10px] tracking-tighter">12</span>
            </div>
            <span className="text-sm font-bold text-[#1C1917]">img</span>
          </Link>
          
          {/* Divider - Hidden on mobile */}
          <div className="hidden md:block w-px h-5 bg-[#E8E4DC]" />
          
          {/* Nav Links - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-[#1C1917] hover:bg-[#FAF8F3] transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          {isAuthenticated ? (
            <>
              {/* Divider - Hidden on mobile */}
              <div className="hidden md:block w-px h-5 bg-[#E8E4DC]" />
              
              {/* Usage Badge - Hidden on mobile */}
              <div className="hidden md:block">
                <UsageBadge 
                  plan={userPlan} 
                  galleryCount={galleryCount} 
                  imageCount={imageCount}
                  storageUsed={storageUsed}
                />
              </div>
              
              {/* Divider - Hidden on mobile */}
              <div className="hidden md:block w-px h-5 bg-[#E8E4DC]" />

              {/* New Gallery Button */}
              <Link href="/upload">
                <Button size="sm" className="h-8 sm:h-7 rounded-full bg-[#1C1917] px-4 sm:px-3 text-sm sm:text-xs font-medium text-white hover:bg-[#292524] transition-all">
                  <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-1" />
                  <span className="hidden sm:inline">New Gallery</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </Link>

              {/* Admin Link - Only for admins, hidden on mobile */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden md:block p-1.5 rounded-full text-amber-600 hover:bg-amber-50 transition-all"
                  title="Admin Panel"
                >
                  <Shield className="h-4 w-4" />
                </Link>
              )}

              {/* User Button - Hidden on mobile */}
              <div className="hidden md:block">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-7 w-7"
                    }
                  }}
                />
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-[#FAF8F3] transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-[#1C1917]" />
                ) : (
                  <Menu className="w-5 h-5 text-[#1C1917]" />
                )}
              </button>
            </>
          ) : (
            <>
              {/* Divider - Hidden on mobile */}
              <div className="hidden md:block w-px h-5 bg-[#E8E4DC]" />
              
              {/* Sign In - Hidden on mobile */}
              <Link
                href="/sign-in"
                className="hidden md:block px-3 py-1.5 rounded-full text-xs font-bold text-[#1C1917] hover:bg-[#FAF8F3] transition-all"
              >
                Sign In
              </Link>
              
              {/* Get Started Button - Hidden on mobile */}
              <div className="hidden md:block">
                <Link href="/sign-up">
                  <Button size="sm" className="h-7 rounded-full bg-[#1C1917] px-3 text-xs font-bold text-white hover:bg-[#292524] transition-all">
                    Get Started
                  </Button>
                </Link>
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-[#FAF8F3] transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-[#1C1917]" />
                ) : (
                  <Menu className="w-5 h-5 text-[#1C1917]" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 mx-auto max-w-sm"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-[#E8E4DC] shadow-lg overflow-hidden">
              <div className="p-3 space-y-1">
                {isAuthenticated ? (
                  <>
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#44403C] hover:bg-[#FAF8F3] transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    
                    <div className="pt-2 mt-2 border-t border-[#E8E4DC]">
                      {/* Usage Badge on mobile */}
                      <div className="px-4 py-2">
                        <UsageBadge 
                          plan={userPlan} 
                          galleryCount={galleryCount} 
                          imageCount={imageCount}
                          storageUsed={storageUsed}
                        />
                      </div>
                      
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      
                      <div className="px-4 py-2 flex items-center gap-3">
                        <UserButton 
                          afterSignOutUrl="/"
                          appearance={{
                            elements: {
                              avatarBox: "h-8 w-8"
                            }
                          }}
                        />
                        <span className="text-sm text-[#78716C]">Account</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button variant="outline" className="w-full rounded-xl">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button className="w-full rounded-xl">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
