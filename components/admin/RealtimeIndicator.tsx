'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function RealtimeIndicator() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <button
      onClick={handleManualRefresh}
      disabled={isRefreshing}
      className="p-1.5 text-[#525252] hover:text-[#141414] border border-[#E5E5E5] hover:border-[#141414] transition-colors disabled:opacity-50"
      title="Refresh"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  )
}
