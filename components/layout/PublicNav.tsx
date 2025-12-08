'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, LayoutDashboard, ChevronDown, Play, Users } from 'lucide-react'
import { useAuthModal } from '@/components/auth/AuthModal'
import { useAuth, UserButton } from '@clerk/nextjs'

export function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [demosOpen, setDemosOpen] = useState(false)
  const demosRef = useRef<HTMLDivElement>(null)
  const { openAuthModal } = useAuthModal()
  const { isSignedIn, isLoaded } = useAuth()

  // Close demos dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (demosRef.current && !demosRef.current.contains(event.target as Node)) {
        setDemosOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Navigation (Floating Pill) */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 pointer-events-none">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-xl border border-stone-200/60 rounded-full px-2 py-1.5 shadow-sm shadow-stone-900/5 pointer-events-auto">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 px-2 py-1">
              <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center">
                <span className="text-white font-bold text-[10px] tracking-tight">12</span>
              </div>
              <span className="text-sm font-bold text-stone-900 hidden sm:block">img</span>
            </Link>
            
            {/* Divider */}
            <div className="w-px h-5 bg-stone-200 mx-1 hidden md:block" />
            
            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center">
              <Link href="/features" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Features
              </Link>
              <Link href="/pricing" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Pricing
              </Link>
              {/* Demos Dropdown */}
              <div ref={demosRef} className="relative">
                <button
                  onClick={() => setDemosOpen(!demosOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all"
                >
                  Demos
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${demosOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {demosOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-stone-200 shadow-xl py-2 z-[100]">
                    <Link
                      href="/view-reel/demo"
                      onClick={() => setDemosOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Play className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">Gallery Reel</p>
                        <p className="text-xs text-stone-500">Cinematic slideshow</p>
                      </div>
                    </Link>
                    <Link
                      href="/portal/demo"
                      onClick={() => setDemosOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">Client Portal</p>
                        <p className="text-xs text-stone-500">Contracts & messaging</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
              <Link href="/help" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Help
              </Link>
            </div>
          </div>
          
          {/* Right: Auth Actions */}
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl border border-stone-200/60 rounded-full px-2 py-1.5 shadow-sm shadow-stone-900/5 pointer-events-auto">
            {isLoaded && isSignedIn ? (
              <>
                {/* Dashboard Link */}
                <Link 
                  href="/"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all hidden sm:flex"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                
                {/* User Button */}
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-7 h-7'
                    }
                  }}
                />
              </>
            ) : (
              <>
                <button 
                  onClick={() => openAuthModal('sign-in')}
                  className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all hidden sm:block"
                >
                  Log in
                </button>
                <button 
                  onClick={() => openAuthModal('sign-up')}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-full transition-colors"
                >
                  Start free
                </button>
              </>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 rounded-full hover:bg-stone-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-stone-600" /> : <Menu className="w-5 h-5 text-stone-600" />}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-20 left-4 right-4 z-50 md:hidden">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
              <div className="p-2">
                <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Features</span>
                </Link>
                <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Pricing</span>
                </Link>
                {/* Demos Section */}
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Demos</p>
                  <Link href="/view-reel/demo" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2 text-stone-600 hover:text-stone-900 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Play className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Gallery Reel</p>
                      <p className="text-xs text-stone-500">Cinematic slideshow</p>
                    </div>
                  </Link>
                  <Link href="/portal/demo" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2 text-stone-600 hover:text-stone-900 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Client Portal</p>
                      <p className="text-xs text-stone-500">Contracts & messaging</p>
                    </div>
                  </Link>
                </div>
                <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Help</span>
                </Link>
              </div>
              
              <div className="border-t border-stone-100 p-3 space-y-2">
                {isLoaded && isSignedIn ? (
                  <>
                    <Link 
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-all"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <UserButton 
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: 'w-9 h-9'
                          }
                        }}
                      />
                      <span className="text-sm text-stone-500">Account</span>
                    </div>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => { setMobileMenuOpen(false); openAuthModal('sign-in') }}
                      className="block w-full px-4 py-2.5 text-center text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-xl transition-colors"
                    >
                      Log in
                    </button>
                    <button 
                      onClick={() => { setMobileMenuOpen(false); openAuthModal('sign-up') }}
                      className="block w-full px-4 py-2.5 text-center text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors"
                    >
                      Start free
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
