'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { updateSettingsSchema } from '@/lib/validation/settings.schema'
import { getUserByClerkId } from '@/server/queries/user.queries'

export async function updateUserSettings(formData: FormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const rawInput = {
    defaultPasswordEnabled: formData.get('defaultPasswordEnabled') === 'true',
    defaultDownloadEnabled: formData.get('defaultDownloadEnabled') === 'true',
  }

  const parseResult = updateSettingsSchema.safeParse(rawInput)
  if (!parseResult.success) {
    return { error: parseResult.error.errors[0].message }
  }

  const input = parseResult.data

  const { error } = await supabaseAdmin
    .from('user_settings')
    .update({
      default_password_enabled: input.defaultPasswordEnabled,
      default_download_enabled: input.defaultDownloadEnabled,
    })
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update settings' }

  revalidatePath('/settings')

  return { success: true }
}
