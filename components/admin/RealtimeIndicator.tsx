'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface RealtimeIndicatorProps {
  refreshInterval?: number // in seconds
}

export function RealtimeIndicator({ refreshInterval = 30 }: RealtimeIndicatorProps) {
  const router = useRouter()
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isLive, setIsLive] = useState(true)
  const [countdown, setCountdown] = useState(refreshInterval)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-refresh countdown
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 0 // Signal to trigger refresh
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isLive])

  // Handle refresh when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isLive) {
      setIsRefreshing(true)
      router.refresh()
      setLastUpdate(new Date())
      setCountdown(refreshInterval)
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }, [countdown, isLive, refreshInterval, router])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setLastUpdate(new Date())
    setCountdown(refreshInterval)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Live toggle */}
      <button
        onClick={() => setIsLive(!isLive)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
          isLive 
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' 
            : 'border border-[#E5E5E5] bg-[#F5F5F7] text-[#525252]'
        }`}
      >
        {isLive ? (
          <>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            LIVE
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            OFF
          </>
        )}
      </button>

      {/* Countdown */}
      {isLive && (
        <span className="text-xs text-[#525252]">
          {countdown}s
        </span>
      )}

      {/* Manual refresh */}
      <button
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        className="p-1.5 text-[#525252] hover:text-[#141414] border border-[#E5E5E5] hover:border-[#141414] transition-colors disabled:opacity-50"
        title="Refresh now"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
