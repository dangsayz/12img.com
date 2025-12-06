'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface RealtimeWrapperProps {
  children: React.ReactNode
  refreshInterval?: number // in seconds
}

export function RealtimeWrapper({ 
  children, 
  refreshInterval = 15 
}: RealtimeWrapperProps) {
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
          // Refresh data
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div>
      {/* Live Status Bar */}
      <div className="mb-4 flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Live indicator */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isLive 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                PAUSED
              </>
            )}
          </button>

          {/* Last update */}
          <span className="text-xs text-gray-500">
            Last updated: {formatTime(lastUpdate)}
          </span>

          {/* Countdown */}
          {isLive && (
            <span className="text-xs text-gray-400">
              Next refresh in {countdown}s
            </span>
          )}
        </div>

        {/* Manual refresh */}
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Now
        </button>
      </div>

      {/* Content */}
      <div className={isRefreshing ? 'opacity-70 transition-opacity' : ''}>
        {children}
      </div>
    </div>
  )
}
