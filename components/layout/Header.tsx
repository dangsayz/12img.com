import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/70 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            12img
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Galleries
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile Create Action */}
          <Link href="/gallery/create" className="md:hidden">
             <Button size="icon" variant="ghost">
               <Plus className="h-5 w-5" />
             </Button>
          </Link>

          {/* Desktop Create Action */}
          <Link href="/gallery/create" className="hidden md:block">
            <Button size="sm" className="rounded-full px-4">
              <Plus className="h-4 w-4 mr-2" />
              New Gallery
            </Button>
          </Link>

          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 ring-2 ring-white"
              }
            }}
          />
        </div>
      </div>
    </header>
  )
}
