/**
 * Feature Flag Client Hook
 * 
 * Use this hook to check if a feature flag is enabled for the current user.
 * The hook handles caching and provides a consistent API.
 * 
 * Usage:
 * ```tsx
 * const { isEnabled, isLoading } = useFeatureFlag('new_gallery_viewer')
 * 
 * if (isEnabled) {
 *   return <NewGalleryViewer />
 * }
 * ```
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

interface FeatureFlagState {
  isEnabled: boolean
  isLoading: boolean
  error: Error | null
}

// Cache for flag evaluations to avoid repeated API calls
const flagCache = new Map<string, { value: boolean; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Hook to check if a feature flag is enabled
 */
export function useFeatureFlag(flagKey: string): FeatureFlagState {
  const [state, setState] = useState<FeatureFlagState>({
    isEnabled: false,
    isLoading: true,
    error: null,
  })
  
  useEffect(() => {
    let cancelled = false
    
    async function checkFlag() {
      // Check cache first
      const cached = flagCache.get(flagKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setState({ isEnabled: cached.value, isLoading: false, error: null })
        return
      }
      
      try {
        const response = await fetch(`/api/flags/${flagKey}`)
        
        if (!response.ok) {
          throw new Error(`Failed to check flag: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!cancelled) {
          // Update cache
          flagCache.set(flagKey, { value: data.enabled, timestamp: Date.now() })
          setState({ isEnabled: data.enabled, isLoading: false, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setState({ 
            isEnabled: false, 
            isLoading: false, 
            error: err instanceof Error ? err : new Error('Unknown error') 
          })
        }
      }
    }
    
    checkFlag()
    
    return () => {
      cancelled = true
    }
  }, [flagKey])
  
  return state
}

/**
 * Hook to check multiple feature flags at once
 */
export function useFeatureFlags(flagKeys: string[]): Record<string, FeatureFlagState> {
  const [states, setStates] = useState<Record<string, FeatureFlagState>>(() => {
    const initial: Record<string, FeatureFlagState> = {}
    for (const key of flagKeys) {
      initial[key] = { isEnabled: false, isLoading: true, error: null }
    }
    return initial
  })
  
  useEffect(() => {
    let cancelled = false
    
    async function checkFlags() {
      const results: Record<string, FeatureFlagState> = {}
      
      await Promise.all(
        flagKeys.map(async (key) => {
          // Check cache first
          const cached = flagCache.get(key)
          if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            results[key] = { isEnabled: cached.value, isLoading: false, error: null }
            return
          }
          
          try {
            const response = await fetch(`/api/flags/${key}`)
            
            if (!response.ok) {
              throw new Error(`Failed to check flag: ${response.statusText}`)
            }
            
            const data = await response.json()
            
            // Update cache
            flagCache.set(key, { value: data.enabled, timestamp: Date.now() })
            results[key] = { isEnabled: data.enabled, isLoading: false, error: null }
          } catch (err) {
            results[key] = { 
              isEnabled: false, 
              isLoading: false, 
              error: err instanceof Error ? err : new Error('Unknown error') 
            }
          }
        })
      )
      
      if (!cancelled) {
        setStates(results)
      }
    }
    
    checkFlags()
    
    return () => {
      cancelled = true
    }
  }, [flagKeys.join(',')])
  
  return states
}

/**
 * Clear the flag cache (useful after login/logout)
 */
export function clearFlagCache(): void {
  flagCache.clear()
}

/**
 * Prefetch flags for faster initial load
 */
export async function prefetchFlags(flagKeys: string[]): Promise<void> {
  await Promise.all(
    flagKeys.map(async (key) => {
      try {
        const response = await fetch(`/api/flags/${key}`)
        if (response.ok) {
          const data = await response.json()
          flagCache.set(key, { value: data.enabled, timestamp: Date.now() })
        }
      } catch {
        // Ignore errors during prefetch
      }
    })
  )
}

/**
 * Server-side flag check (for use in Server Components)
 * Import this in server components, not the hook
 */
export async function checkFeatureFlag(
  flagKey: string,
  userId?: string,
  userPlan?: string
): Promise<boolean> {
  // This should be called from server components
  // It directly queries the database
  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  
  const { data, error } = await supabaseAdmin.rpc('evaluate_feature_flag', {
    p_flag_key: flagKey,
    p_user_id: userId || null,
    p_user_plan: userPlan || null,
    p_user_email: null,
  })
  
  if (error) {
    console.error('Flag check error:', error)
    return false
  }
  
  return data === true
}
