import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">
          12img
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/gallery/create"
            className="text-sm text-gray-600 hover:text-black"
          >
            New Gallery
          </Link>
          <Link
            href="/settings"
            className="text-sm text-gray-600 hover:text-black"
          >
            Settings
          </Link>
          <UserButton afterSignOutUrl="/sign-in" />
        </nav>
      </div>
    </header>
  )
}
