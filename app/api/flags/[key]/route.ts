/**
 * Feature Flag Evaluation API
 * 
 * GET /api/flags/[key]
 * Returns whether a flag is enabled for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params
  
  // Get current user if authenticated
  const { userId: clerkId } = await auth()
  
  let dbUserId: string | null = null
  let userPlan: string | null = null
  let userEmail: string | null = null
  
  if (clerkId) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, plan, email')
      .eq('clerk_id', clerkId)
      .single()
    
    if (user) {
      dbUserId = user.id
      userPlan = user.plan
      userEmail = user.email
    }
  }
  
  // Evaluate the flag
  const { data: enabled, error } = await supabaseAdmin.rpc('evaluate_feature_flag', {
    p_flag_key: key,
    p_user_id: dbUserId,
    p_user_plan: userPlan,
    p_user_email: userEmail,
  })
  
  if (error) {
    // If RPC fails, try direct query
    const { data: flag } = await supabaseAdmin
      .from('feature_flags')
      .select('is_enabled, flag_type, target_plans, rollout_percentage')
      .eq('key', key)
      .single()
    
    if (!flag) {
      return NextResponse.json({ enabled: false, reason: 'not_found' })
    }
    
    // Simple evaluation fallback
    let isEnabled = flag.is_enabled
    
    if (isEnabled && flag.flag_type === 'plan_based' && userPlan) {
      isEnabled = flag.target_plans?.includes(userPlan) || false
    }
    
    return NextResponse.json({ enabled: isEnabled })
  }
  
  return NextResponse.json({ enabled: enabled === true })
}
