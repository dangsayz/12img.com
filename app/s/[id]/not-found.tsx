import Link from 'next/link'
import { ImageOff } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
          <ImageOff className="w-8 h-8 text-white/60" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Image not found
        </h1>
        <p className="text-white/60 mb-8 max-w-sm">
          This image may have expired or the link is incorrect.
        </p>
        <Link
          href="/share"
          className="inline-flex px-6 py-3 bg-white text-neutral-900 rounded-full font-medium hover:bg-white/90 transition-colors"
        >
          Upload your own image
        </Link>
      </div>

      {/* Branding */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <Link href="/" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <span className="text-neutral-900 font-bold text-xs">12</span>
          </div>
          <span className="text-white/80 text-sm">12img.com</span>
        </Link>
      </div>
    </div>
  )
}
