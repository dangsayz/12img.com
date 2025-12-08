import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'
import { getUserByClerkId } from '@/server/queries/user.queries'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Welcome to 12img',
  description: 'Set up your photography business profile',
}

export default async function OnboardingPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user has already completed onboarding
  const user = await getUserByClerkId(userId)
  if (user) {
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()
    
    if (settings?.onboarding_completed) {
      redirect('/gallery')
    }
  }

  return <OnboardingForm />
}
