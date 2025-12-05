import { z } from 'zod'

export const createGallerySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .transform((val) => val.trim()),

  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(100, 'Password must be 100 characters or less')
    .nullable()
    .optional(),

  downloadEnabled: z.boolean().default(true),
})

export const updateGallerySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .transform((val) => val.trim())
    .optional(),

  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(100, 'Password must be 100 characters or less')
    .nullable()
    .optional(),

  downloadEnabled: z.boolean().optional(),
})

export type CreateGalleryInput = z.infer<typeof createGallerySchema>
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>
