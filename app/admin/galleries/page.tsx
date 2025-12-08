import { Image } from 'lucide-react'

export default function AdminGalleriesPage() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl text-[#141414]">Galleries</h1>
        <p className="text-[#525252] mt-2">Browse and manage all galleries</p>
      </div>
      
      <div className="bg-white border border-[#E5E5E5] p-16">
        <div className="text-center">
          <div className="w-16 h-16 border border-[#E5E5E5] flex items-center justify-center mx-auto mb-6">
            <Image className="w-8 h-8 text-[#525252]" />
          </div>
          <h3 className="font-serif text-2xl text-[#141414] mb-3">Coming Soon</h3>
          <p className="text-[#525252] max-w-sm mx-auto">
            Gallery browser with search, filters, and bulk actions will be available here.
          </p>
        </div>
      </div>
    </div>
  )
}
