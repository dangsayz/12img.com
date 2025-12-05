'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'

export function Header() {
  const [hidden, setHidden] = useState(false)
  const { scrollY } = useScroll()
  const lastScrollY = useRef(0)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const diff = latest - lastScrollY.current
    
    // Hide when scrolling down more than 10px, show when scrolling up
    if (diff > 10 && latest > 100) {
      setHidden(true)
    } else if (diff < -10 || latest < 100) {
      setHidden(false)
    }
    
    lastScrollY.current = latest
  })

  return (
    <motion.header 
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      initial={{ y: 0 }}
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="pointer-events-auto flex h-16 w-full max-w-6xl items-center justify-between rounded-full border border-white/40 bg-white/80 pl-8 pr-3 shadow-soft-xl backdrop-blur-xl transition-all hover:bg-white/90">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-soft-lime flex items-center justify-center text-soft-accent font-bold shadow-inner-light text-sm">
              12
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">12img</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all"
            >
              Galleries
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all"
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Create Action */}
          <Link href="/upload" className="md:hidden">
             <Button size="icon" variant="ghost" className="rounded-full">
               <Plus className="h-5 w-5" />
             </Button>
          </Link>

          {/* Desktop Create Action */}
          <Link href="/upload" className="hidden md:block">
            <Button size="sm" className="h-10 rounded-full bg-gray-900 px-6 text-sm font-medium text-white shadow-lg hover:bg-gray-800 hover:scale-105 transition-all">
              <Plus className="h-4 w-4 mr-2" />
              New Gallery
            </Button>
          </Link>

          <div className="pl-2 border-l border-gray-200">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 ring-2 ring-white shadow-sm"
                }
              }}
            />
          </div>
        </div>
      </div>
    </motion.header>
  )
}
