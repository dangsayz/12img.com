import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getUserByClerkId(clerkId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  if (error) return null
  return data
}

export async function getUserSettings(clerkId: string) {
  const user = await getUserByClerkId(clerkId)
  if (!user) {
    return {
      defaultPasswordEnabled: false,
      defaultDownloadEnabled: true,
    }
  }

  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('default_password_enabled, default_download_enabled')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return {
      defaultPasswordEnabled: false,
      defaultDownloadEnabled: true,
    }
  }

  return {
    defaultPasswordEnabled: data.default_password_enabled,
    defaultDownloadEnabled: data.default_download_enabled,
  }
}
