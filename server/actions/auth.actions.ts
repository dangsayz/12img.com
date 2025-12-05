'use server'

import { cookies } from 'next/headers'
import { verifyPassword, generateUnlockToken } from '@/lib/utils/password'
import { getGalleryById } from '@/server/queries/gallery.queries'

export async function validateGalleryPassword(
  galleryId: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (!galleryId || typeof galleryId !== 'string') {
    return { success: false, error: 'Invalid gallery ID' }
  }

  if (!password || typeof password !== 'string') {
    return { success: false, error: 'Password is required' }
  }

  const gallery = await getGalleryById(galleryId)

  if (!gallery) {
    // Simulate hash time to prevent timing attack
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 100))
    return { success: false, error: 'Incorrect password' }
  }

  if (!gallery.password_hash) {
    return { success: false, error: 'Gallery not protected' }
  }

  const isValid = await verifyPassword(password, gallery.password_hash)

  if (!isValid) {
    return { success: false, error: 'Incorrect password' }
  }

  // Generate unlock token and set cookie
  const token = generateUnlockToken(galleryId)

  const cookieStore = cookies()
  cookieStore.set(`gallery_unlock_${galleryId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return { success: true }
}
