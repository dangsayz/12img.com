'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LayoutDashboard } from 'lucide-react'
import { useAuthModal } from '@/components/auth/AuthModal'
import { useAuth, UserButton } from '@clerk/nextjs'

export function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { openAuthModal } = useAuthModal()
  const { isSignedIn, isLoaded } = useAuth()

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
              <Link href="/view-reel/demo" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Demo
              </Link>
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
                <Link href="/view-reel/demo" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Demo Gallery</span>
                </Link>
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
