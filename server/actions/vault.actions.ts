'use server'

/**
 * Client Vault Actions
 * 
 * Server actions for managing client photo vaults - a storage add-on
 * that allows clients to pay to keep their photos after gallery expiry.
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import { getGalleryWithOwnershipCheck } from '@/server/queries/gallery.queries'
import { VAULT_PLANS, getVaultStorageLimitBytes, type VaultPlanId } from '@/lib/config/vault-pricing'
import type { Tables } from '@/types/database'

type ClientVault = Tables<'client_vaults'>
type VaultImage = Tables<'vault_images'>
type VaultInvitation = Tables<'vault_invitations'>

// ============================================
// VAULT INVITATIONS
// ============================================

/**
 * Create a vault invitation for a client.
 * Sends an email with a link to purchase vault storage.
 */
export async function createVaultInvitation(
  galleryId: string,
  clientEmail: string,
  clientName?: string
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(clientEmail)) {
    return { error: 'Invalid email address' }
  }

  try {
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Invitation expires in 30 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Check for existing pending invitation
    const { data: existing } = await supabaseAdmin
      .from('vault_invitations')
      .select('id')
      .eq('gallery_id', galleryId)
      .eq('client_email', clientEmail.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existing) {
      return { error: 'An invitation already exists for this email' }
    }

    // Create invitation
    const { data: invitation, error } = await supabaseAdmin
      .from('vault_invitations')
      .insert({
        gallery_id: galleryId,
        photographer_id: user.id,
        client_email: clientEmail.toLowerCase().trim(),
        client_name: clientName?.trim() || null,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[createVaultInvitation] Error:', error)
      return { error: 'Failed to create invitation' }
    }

    // Return token (not hash) for building the purchase link
    return {
      success: true,
      invitation,
      token, // Used to build the purchase URL
      purchaseUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/vault/purchase?token=${token}`,
    }
  } catch (e) {
    console.error('[createVaultInvitation] Error:', e)
    return { error: 'Failed to create invitation' }
  }
}

/**
 * Get all vault invitations for a gallery.
 */
export async function getGalleryVaultInvitations(galleryId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  try {
    const { data, error } = await supabaseAdmin
      .from('vault_invitations')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: 'Failed to fetch invitations' }
    }

    return { success: true, invitations: data || [] }
  } catch (e) {
    console.error('[getGalleryVaultInvitations] Error:', e)
    return { error: 'Failed to fetch invitations' }
  }
}

/**
 * Resend a vault invitation email.
 */
export async function resendVaultInvitation(invitationId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    // Get invitation
    const { data: invitation, error } = await supabaseAdmin
      .from('vault_invitations')
      .select('*, galleries(*)')
      .eq('id', invitationId)
      .eq('photographer_id', user.id)
      .single()

    if (error || !invitation) {
      return { error: 'Invitation not found' }
    }

    if (invitation.status === 'purchased') {
      return { error: 'This invitation has already been used' }
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return { error: 'This invitation has expired' }
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Extend expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Update invitation
    await supabaseAdmin
      .from('vault_invitations')
      .update({
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invitationId)

    // TODO: Send email with new token
    // await sendVaultInvitationEmail(invitation, token)

    return {
      success: true,
      token,
      purchaseUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/vault/purchase?token=${token}`,
    }
  } catch (e) {
    console.error('[resendVaultInvitation] Error:', e)
    return { error: 'Failed to resend invitation' }
  }
}

/**
 * Cancel a vault invitation.
 */
export async function cancelVaultInvitation(invitationId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    const { error } = await supabaseAdmin
      .from('vault_invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId)
      .eq('photographer_id', user.id)

    if (error) {
      return { error: 'Failed to cancel invitation' }
    }

    return { success: true }
  } catch (e) {
    console.error('[cancelVaultInvitation] Error:', e)
    return { error: 'Failed to cancel invitation' }
  }
}

// ============================================
// VAULT MANAGEMENT (for photographers)
// ============================================

/**
 * Get all client vaults for the authenticated photographer.
 */
export async function getPhotographerVaults() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    const { data, error } = await supabaseAdmin
      .from('client_vaults')
      .select(`
        *,
        vault_plans(*),
        galleries(id, title, slug)
      `)
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: 'Failed to fetch vaults' }
    }

    return { success: true, vaults: data || [] }
  } catch (e) {
    console.error('[getPhotographerVaults] Error:', e)
    return { error: 'Failed to fetch vaults' }
  }
}

/**
 * Get a specific client vault with images.
 */
export async function getVaultDetails(vaultId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    const { data: vault, error } = await supabaseAdmin
      .from('client_vaults')
      .select(`
        *,
        vault_plans(*),
        galleries(id, title, slug),
        vault_images(*)
      `)
      .eq('id', vaultId)
      .eq('photographer_id', user.id)
      .single()

    if (error || !vault) {
      return { error: 'Vault not found' }
    }

    return { success: true, vault }
  } catch (e) {
    console.error('[getVaultDetails] Error:', e)
    return { error: 'Failed to fetch vault' }
  }
}

// ============================================
// VAULT CREATION (after Stripe payment)
// ============================================

/**
 * Create a vault after successful payment.
 * This is called from the Stripe webhook.
 */
export async function createVaultFromPayment(params: {
  invitationToken: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  vaultPlanId: VaultPlanId
  billingPeriod: 'monthly' | 'annual'
}) {
  const { invitationToken, stripeCustomerId, stripeSubscriptionId, vaultPlanId, billingPeriod } = params

  try {
    // Hash the token to find the invitation
    const tokenHash = crypto.createHash('sha256').update(invitationToken).digest('hex')

    // Get invitation
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('vault_invitations')
      .select('*, galleries(*)')
      .eq('token_hash', tokenHash)
      .single()

    if (invError || !invitation) {
      return { error: 'Invalid invitation token' }
    }

    if (invitation.status === 'purchased') {
      return { error: 'This invitation has already been used' }
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return { error: 'This invitation has expired' }
    }

    const plan = VAULT_PLANS[vaultPlanId]
    if (!plan) {
      return { error: 'Invalid vault plan' }
    }

    // Calculate expiry (1 year for annual, 1 month for monthly)
    const expiresAt = new Date()
    if (billingPeriod === 'annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    // Create the vault
    const { data: vault, error: vaultError } = await supabaseAdmin
      .from('client_vaults')
      .insert({
        client_email: invitation.client_email,
        client_name: invitation.client_name,
        photographer_id: invitation.photographer_id,
        original_gallery_id: invitation.gallery_id,
        vault_plan_id: vaultPlanId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        subscription_status: 'active',
        billing_period: billingPeriod,
        storage_limit_bytes: getVaultStorageLimitBytes(vaultPlanId),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (vaultError || !vault) {
      console.error('[createVaultFromPayment] Error creating vault:', vaultError)
      return { error: 'Failed to create vault' }
    }

    // Update invitation status
    await supabaseAdmin
      .from('vault_invitations')
      .update({
        status: 'purchased',
        purchased_at: new Date().toISOString(),
        vault_id: vault.id,
      })
      .eq('id', invitation.id)

    // Copy images from gallery to vault
    if (invitation.gallery_id) {
      await copyGalleryImagesToVault(invitation.gallery_id, vault.id)
    }

    // Generate access token for client
    const accessToken = crypto.randomBytes(32).toString('hex')
    const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex')

    const tokenExpiresAt = new Date()
    tokenExpiresAt.setFullYear(tokenExpiresAt.getFullYear() + 10) // Long-lived token

    await supabaseAdmin
      .from('vault_access_tokens')
      .insert({
        vault_id: vault.id,
        token_hash: accessTokenHash,
        expires_at: tokenExpiresAt.toISOString(),
      })

    // Update vault with access token hash
    await supabaseAdmin
      .from('client_vaults')
      .update({ access_token_hash: accessTokenHash })
      .eq('id', vault.id)

    return {
      success: true,
      vault,
      accessToken, // Send this to client
      accessUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/vault/view?token=${accessToken}`,
    }
  } catch (e) {
    console.error('[createVaultFromPayment] Error:', e)
    return { error: 'Failed to create vault' }
  }
}

/**
 * Copy all images from a gallery to a vault.
 * Images are copied to a new storage location.
 */
async function copyGalleryImagesToVault(galleryId: string, vaultId: string) {
  try {
    // Get all images from the gallery
    const { data: images, error } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('position', { ascending: true })

    if (error || !images || images.length === 0) {
      console.log('[copyGalleryImagesToVault] No images to copy')
      return
    }

    // Copy each image to vault storage
    for (let i = 0; i < images.length; i++) {
      const image = images[i]

      // Copy file in Supabase storage
      const sourcePath = image.storage_path
      const destPath = `${vaultId}/${crypto.randomUUID()}-${image.original_filename}`

      const { error: copyError } = await supabaseAdmin.storage
        .from('photos')
        .copy(sourcePath, `../client-vaults/${destPath}`)

      if (copyError) {
        console.error(`[copyGalleryImagesToVault] Failed to copy image ${image.id}:`, copyError)
        // Continue with other images
        continue
      }

      // Create vault image record
      await supabaseAdmin
        .from('vault_images')
        .insert({
          vault_id: vaultId,
          storage_path: destPath,
          original_filename: image.original_filename,
          file_size_bytes: image.file_size_bytes,
          mime_type: image.mime_type,
          width: image.width,
          height: image.height,
          original_image_id: image.id,
          position: i,
        })
    }

    console.log(`[copyGalleryImagesToVault] Copied ${images.length} images to vault ${vaultId}`)
  } catch (e) {
    console.error('[copyGalleryImagesToVault] Error:', e)
  }
}

// ============================================
// CLIENT VAULT ACCESS (public, no auth needed)
// ============================================

/**
 * Get vault by access token (for clients viewing their vault).
 * No authentication required - uses secure token.
 */
export async function getVaultByAccessToken(token: string) {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Validate token
    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from('vault_access_tokens')
      .select('*, client_vaults(*)')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .single()

    if (tokenError || !tokenRecord) {
      return { error: 'Invalid or expired access token' }
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return { error: 'Access token has expired' }
    }

    // Update usage stats
    await supabaseAdmin
      .from('vault_access_tokens')
      .update({
        last_used_at: new Date().toISOString(),
        use_count: tokenRecord.use_count + 1,
      })
      .eq('id', tokenRecord.id)

    // Get vault with images
    const { data: vault, error: vaultError } = await supabaseAdmin
      .from('client_vaults')
      .select(`
        *,
        vault_plans(*),
        vault_images(*)
      `)
      .eq('id', tokenRecord.vault_id)
      .single()

    if (vaultError || !vault) {
      return { error: 'Vault not found' }
    }

    // Check subscription status
    if (vault.subscription_status !== 'active') {
      return {
        error: 'Vault subscription is not active',
        status: vault.subscription_status,
      }
    }

    return { success: true, vault }
  } catch (e) {
    console.error('[getVaultByAccessToken] Error:', e)
    return { error: 'Failed to access vault' }
  }
}

/**
 * Get signed URL for a vault image (for clients to view/download).
 */
export async function getVaultImageUrl(token: string, imageId: string) {
  try {
    // Verify access token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from('vault_access_tokens')
      .select('vault_id')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .single()

    if (tokenError || !tokenRecord) {
      return { error: 'Invalid access token' }
    }

    // Get image
    const { data: image, error: imageError } = await supabaseAdmin
      .from('vault_images')
      .select('*')
      .eq('id', imageId)
      .eq('vault_id', tokenRecord.vault_id)
      .single()

    if (imageError || !image) {
      return { error: 'Image not found' }
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('client-vaults')
      .createSignedUrl(image.storage_path, 3600)

    if (urlError || !signedUrl) {
      return { error: 'Failed to generate download URL' }
    }

    return { success: true, url: signedUrl.signedUrl }
  } catch (e) {
    console.error('[getVaultImageUrl] Error:', e)
    return { error: 'Failed to get image URL' }
  }
}

// ============================================
// INVITATION VALIDATION (public)
// ============================================

/**
 * Validate a vault invitation token and get gallery info.
 * Used on the purchase page before payment.
 */
export async function validateVaultInvitation(token: string) {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const { data: invitation, error } = await supabaseAdmin
      .from('vault_invitations')
      .select(`
        *,
        galleries(id, title, slug),
        users!vault_invitations_photographer_id_fkey(
          id,
          display_name,
          user_settings(business_name, logo_url)
        )
      `)
      .eq('token_hash', tokenHash)
      .single()

    if (error || !invitation) {
      return { error: 'Invalid invitation link' }
    }

    if (invitation.status === 'purchased') {
      return { error: 'This invitation has already been used' }
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return { error: 'This invitation has expired' }
    }

    // Mark as clicked
    if (invitation.status === 'pending' || invitation.status === 'sent') {
      await supabaseAdmin
        .from('vault_invitations')
        .update({
          status: 'clicked',
          clicked_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)
    }

    // Get image count from gallery
    const { count } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', invitation.gallery_id)

    return {
      success: true,
      invitation: {
        id: invitation.id,
        clientEmail: invitation.client_email,
        clientName: invitation.client_name,
        gallery: invitation.galleries,
        photographer: invitation.users,
        imageCount: count || 0,
      },
      plans: VAULT_PLANS,
    }
  } catch (e) {
    console.error('[validateVaultInvitation] Error:', e)
    return { error: 'Failed to validate invitation' }
  }
}
