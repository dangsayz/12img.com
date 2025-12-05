import { z } from 'zod'

export const updateSettingsSchema = z.object({
  defaultPasswordEnabled: z.boolean().optional(),
  defaultDownloadEnabled: z.boolean().optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
