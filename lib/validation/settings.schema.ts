import { z } from 'zod'

export const updateSettingsSchema = z.object({
  defaultPasswordEnabled: z.boolean().optional(),
  defaultDownloadEnabled: z.boolean().optional(),
  defaultGalleryExpiryDays: z.number().min(1).max(365).nullable().optional(),
  defaultWatermarkEnabled: z.boolean().optional(),
})

export const updateBrandingSchema = z.object({
  businessName: z.string().max(100).optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
})

export const updateNotificationsSchema = z.object({
  notifyGalleryViewed: z.boolean().optional(),
  notifyImagesDownloaded: z.boolean().optional(),
  notifyArchiveReady: z.boolean().optional(),
  emailDigestFrequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>
export type UpdateNotificationsInput = z.infer<typeof updateNotificationsSchema>
