import { HardDrive } from 'lucide-react'

export default function AdminStoragePage() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl text-[#141414]">Storage</h1>
        <p className="text-[#525252] mt-2">Monitor storage usage and manage files</p>
      </div>
      
      <div className="bg-white border border-[#E5E5E5] p-16">
        <div className="text-center">
          <div className="w-16 h-16 border border-[#E5E5E5] flex items-center justify-center mx-auto mb-6">
            <HardDrive className="w-8 h-8 text-[#525252]" />
          </div>
          <h3 className="font-serif text-2xl text-[#141414] mb-3">Coming Soon</h3>
          <p className="text-[#525252] max-w-sm mx-auto">
            Storage analytics, orphan file cleanup, and bucket management coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
