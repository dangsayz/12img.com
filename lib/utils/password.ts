import bcrypt from 'bcryptjs'
import { createHmac, randomBytes } from 'crypto'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateUnlockToken(galleryId: string): string {
  const secret = process.env.GALLERY_TOKEN_SECRET
  if (!secret) throw new Error('GALLERY_TOKEN_SECRET not configured')

  const timestamp = Date.now()
  const nonce = randomBytes(16).toString('hex')
  const payload = `${galleryId}:${timestamp}:${nonce}`

  const signature = createHmac('sha256', secret).update(payload).digest('hex')

  return `${payload}:${signature}`
}

export function verifyUnlockToken(token: string, galleryId: string): boolean {
  const secret = process.env.GALLERY_TOKEN_SECRET
  if (!secret) return false

  try {
    const parts = token.split(':')
    if (parts.length !== 4) return false

    const [tokenGalleryId, timestamp, nonce, signature] = parts

    // Verify gallery ID matches
    if (tokenGalleryId !== galleryId) return false

    // Verify not expired (24 hours)
    const tokenTime = parseInt(timestamp, 10)
    if (Date.now() - tokenTime > 24 * 60 * 60 * 1000) return false

    // Verify signature
    const payload = `${tokenGalleryId}:${timestamp}:${nonce}`
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  } catch {
    return false
  }
}
