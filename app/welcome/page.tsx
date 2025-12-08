import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen'
import { getUserByClerkId } from '@/server/queries/user.queries'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Welcome to 12img',
  description: 'Get started with your first gallery',
}

export default async function WelcomePage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Get user's business name for personalization
  const user = await getUserByClerkId(userId)
  let businessName = null
  
  if (user) {
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, onboarding_completed')
      .eq('user_id', user.id)
      .single()
    
    // If onboarding not completed, redirect there first
    if (!settings?.onboarding_completed) {
      redirect('/onboarding')
    }
    
    businessName = settings?.business_name
  }

  return <WelcomeScreen businessName={businessName} />
}
