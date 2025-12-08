import { Flag } from 'lucide-react'

export default function AdminFlagsPage() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl text-[#141414]">Feature Flags</h1>
        <p className="text-[#525252] mt-2">Toggle features and manage rollouts</p>
      </div>
      
      <div className="bg-white border border-[#E5E5E5] p-16">
        <div className="text-center">
          <div className="w-16 h-16 border border-[#E5E5E5] flex items-center justify-center mx-auto mb-6">
            <Flag className="w-8 h-8 text-[#525252]" />
          </div>
          <h3 className="font-serif text-2xl text-[#141414] mb-3">Coming Soon</h3>
          <p className="text-[#525252] max-w-sm mx-auto">
            Feature flag management with targeting and gradual rollout controls coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
