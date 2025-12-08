'use server'

import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'

interface OnboardingData {
  businessName: string
  photographyType: string
  country: string
  state: string
  referralCode: string
}

export async function completeOnboarding(data: OnboardingData): Promise<{ success: boolean; error?: string; profileSlug?: string }> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get or create user
    const user = await getOrCreateUserByClerkId(userId)
    if (!user) {
      return { success: false, error: 'Failed to get user' }
    }

    // Generate profile slug from business name
    const baseSlug = data.businessName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    // Get unique slug (append number if taken)
    let profileSlug = baseSlug || 'photographer'
    if (profileSlug.length < 3) {
      profileSlug = profileSlug + '-studio'
    }
    
    // Check if slug is taken and make unique
    let counter = 0
    let finalSlug = profileSlug
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('profile_slug', finalSlug)
        .neq('id', user.id)
        .single()
      
      if (!existing) break
      counter++
      finalSlug = `${profileSlug}-${counter}`
    }

    // Update user with profile slug and display name
    await supabaseAdmin
      .from('users')
      .update({
        profile_slug: finalSlug,
        display_name: data.businessName.trim(),
      })
      .eq('id', user.id)

    // Update user settings with onboarding data
    const { error } = await supabaseAdmin
      .from('user_settings')
      .upsert({
        user_id: user.id,
        business_name: data.businessName.trim(),
        photography_type: data.photographyType,
        country: data.country || null,
        state: data.state || null,
        referral_code: data.referralCode.trim() || null,
        onboarding_completed: true,
      }, {
        onConflict: 'user_id',
      })

    if (error) {
      console.error('Failed to save onboarding data:', error)
      return { success: false, error: 'Failed to save your information' }
    }

    return { success: true, profileSlug: finalSlug }
  } catch (error) {
    console.error('Onboarding error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}

export async function checkOnboardingStatus(): Promise<boolean> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return false
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return false
    }

    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()

    return settings?.onboarding_completed ?? false
  } catch {
    return false
  }
}

export async function markWelcomeSeen(): Promise<{ success: boolean }> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false }
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { success: false }
    }

    await supabaseAdmin
      .from('user_settings')
      .update({ welcome_seen: true })
      .eq('user_id', user.id)

    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function checkWelcomeSeen(): Promise<boolean> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return true // Default to true so we don't block
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return true
    }

    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('welcome_seen')
      .eq('user_id', user.id)
      .single()

    return settings?.welcome_seen ?? false
  } catch {
    return true
  }
}
