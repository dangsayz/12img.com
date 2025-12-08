'use server'

import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Dismiss a feature hint so it never shows again for this user
 */
export async function dismissHint(hintId: string): Promise<{ success: boolean }> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) return { success: false }

    // Get current dismissed hints
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('dismissed_hints')
      .eq('user_id', user.id)
      .single()

    const currentHints = settings?.dismissed_hints ?? []
    
    // Only add if not already dismissed
    if (!currentHints.includes(hintId)) {
      await supabaseAdmin
        .from('user_settings')
        .upsert({
          user_id: user.id,
          dismissed_hints: [...currentHints, hintId],
        }, { onConflict: 'user_id' })
    }

    return { success: true }
  } catch {
    return { success: false }
  }
}

/**
 * Get all dismissed hints for the current user
 */
export async function getDismissedHints(): Promise<string[]> {
  try {
    const { userId } = await auth()
    if (!userId) return []

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) return []

    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('dismissed_hints')
      .eq('user_id', user.id)
      .single()

    return settings?.dismissed_hints ?? []
  } catch {
    return []
  }
}

/**
 * Check if a specific hint has been dismissed
 */
export async function isHintDismissed(hintId: string): Promise<boolean> {
  const dismissed = await getDismissedHints()
  return dismissed.includes(hintId)
}
