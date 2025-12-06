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

  // Auto-refresh
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsRefreshing(true)
          router.refresh()
          setLastUpdate(new Date())
          setTimeout(() => setIsRefreshing(false), 500)
          return refreshInterval
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isLive, refreshInterval, router])

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
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
          isLive 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-gray-100 text-gray-500'
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
        <span className="text-xs text-gray-400">
          {countdown}s
        </span>
      )}

      {/* Manual refresh */}
      <button
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        title="Refresh now"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
