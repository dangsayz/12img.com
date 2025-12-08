import Link from 'next/link'
import { ImageOff, ArrowRight } from 'lucide-react'

export default function CardNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-stone-100 flex items-center justify-center">
          <ImageOff className="w-10 h-10 text-stone-400" />
        </div>
        
        <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 mb-3">
          Card not found
        </h1>
        
        <p className="text-stone-500 mb-8">
          This card may have expired or been removed. Cards are available for 30 days after creation.
        </p>
        
        <Link
          href="/#features"
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-full transition-colors"
        >
          Create your own card
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
