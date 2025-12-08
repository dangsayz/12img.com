'use server'

/**
 * Message Actions
 * 
 * Server actions for the client-photographer messaging system.
 * Includes automatic email notification on first message.
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import type { MessageStatus, MessageType, Tables } from '@/types/database'
import {
  type ActionResult,
  userError,
  systemError,
  validationError,
} from '@/lib/contracts/types'
import { sendNewMessageNotification, sendClientReplyNotification } from '@/server/services/message-email.service'

// ============================================
// TYPES
// ============================================

export interface Message {
  id: string
  clientId: string
  photographerId: string
  isFromPhotographer: boolean
  messageType: MessageType
  content: string
  status: MessageStatus
  createdAt: string
  deliveredAt: string | null
  readAt: string | null
  attachments?: MessageAttachment[]
}

export interface MessageAttachment {
  id: string
  messageId: string
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  width: number | null
  height: number | null
  thumbnailPath: string | null
}

export interface MessageThread {
  clientId: string
  clientName: string
  clientEmail: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  isFromPhotographer: boolean
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const sendMessageSchema = z.object({
  clientId: z.string().uuid(),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
})

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapDbToMessage(row: Tables<'messages'>, attachments?: Tables<'message_attachments'>[]): Message {
  return {
    id: row.id,
    clientId: row.client_id,
    photographerId: row.photographer_id,
    isFromPhotographer: row.is_from_photographer,
    messageType: row.message_type as MessageType,
    content: row.content,
    status: row.status as MessageStatus,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    attachments: attachments?.map(a => ({
      id: a.id,
      messageId: a.message_id,
      fileName: a.file_name,
      fileType: a.file_type,
      fileSize: a.file_size,
      storagePath: a.storage_path,
      width: a.width,
      height: a.height,
      thumbnailPath: a.thumbnail_path,
    })),
  }
}

function sanitizeContent(content: string): string {
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ============================================
// SEND MESSAGE (Photographer)
// ============================================

export async function sendMessage(
  input: z.infer<typeof sendMessageSchema>
): Promise<ActionResult<Message>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  const validation = sendMessageSchema.safeParse(input)
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    return {
      success: false,
      error: validationError('INVALID_INPUT', firstError.message, firstError.path.join('.')),
    }
  }

  const { clientId, content, messageType } = validation.data

  try {
    // Verify client belongs to photographer and get client details
    const { data: client } = await supabaseAdmin
      .from('client_profiles')
      .select('id, first_name, last_name, email')
      .eq('id', clientId)
      .eq('photographer_id', user.id)
      .single()

    if (!client) {
      return { success: false, error: userError('NOT_FOUND', 'Client not found') }
    }

    // Check if this is the first message to this client
    const { count: existingMessageCount } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('photographer_id', user.id)

    const isFirstMessage = (existingMessageCount || 0) === 0

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        client_id: clientId,
        photographer_id: user.id,
        is_from_photographer: true,
        message_type: messageType,
        content: sanitizeContent(content),
        status: 'sent',
      })
      .select()
      .single()

    if (error) {
      console.error('[sendMessage] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to send message') }
    }

    // Send email notification on first message (or always, configurable)
    // This emails the client with a portal link so they can join the conversation
    if (isFirstMessage) {
      try {
        await sendNewMessageNotification({
          clientId,
          clientEmail: client.email,
          clientName: `${client.first_name} ${client.last_name}`,
          photographerId: user.id,
          photographerName: user.display_name || 'Your Photographer',
          messagePreview: content.substring(0, 200),
        })
        console.log('[sendMessage] First message notification sent to:', client.email)
      } catch (emailError) {
        // Don't fail the message send if email fails
        console.error('[sendMessage] Failed to send email notification:', emailError)
      }
    }

    revalidatePath(`/dashboard/clients/${clientId}`)

    return { success: true, data: mapDbToMessage(message) }
  } catch (e) {
    console.error('[sendMessage] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// SEND MESSAGE (Client Portal)
// ============================================

export async function sendClientMessage(
  clientId: string,
  photographerId: string,
  content: string
): Promise<ActionResult<Message>> {
  if (!content || content.length > 5000) {
    return { success: false, error: validationError('INVALID_INPUT', 'Message must be 1-5000 characters', 'content') }
  }

  try {
    // Get client and photographer info for notification
    const [clientResult, photographerResult] = await Promise.all([
      supabaseAdmin
        .from('client_profiles')
        .select('first_name, last_name')
        .eq('id', clientId)
        .single(),
      supabaseAdmin
        .from('users')
        .select('email, display_name')
        .eq('id', photographerId)
        .single(),
    ])

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        client_id: clientId,
        photographer_id: photographerId,
        is_from_photographer: false,
        message_type: 'text',
        content: sanitizeContent(content),
        status: 'sent',
      })
      .select()
      .single()

    if (error) {
      console.error('[sendClientMessage] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to send message') }
    }

    // Notify photographer of client reply
    if (clientResult.data && photographerResult.data) {
      try {
        await sendClientReplyNotification({
          photographerEmail: photographerResult.data.email,
          photographerName: photographerResult.data.display_name || 'Photographer',
          clientName: `${clientResult.data.first_name} ${clientResult.data.last_name}`,
          clientId,
          messagePreview: content.substring(0, 200),
        })
        console.log('[sendClientMessage] Reply notification sent to photographer')
      } catch (emailError) {
        // Don't fail the message send if email fails
        console.error('[sendClientMessage] Failed to send reply notification:', emailError)
      }
    }

    return { success: true, data: mapDbToMessage(message) }
  } catch (e) {
    console.error('[sendClientMessage] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET MESSAGES
// ============================================

export async function getMessages(
  clientId: string,
  options?: { limit?: number; before?: string }
): Promise<ActionResult<Message[]>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  const { limit = 50, before } = options || {}

  try {
    let query = supabaseAdmin
      .from('messages')
      .select('*, message_attachments(*)')
      .eq('client_id', clientId)
      .eq('photographer_id', user.id)
      .is('deleted_at', null)
      .eq('deleted_by_photographer', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getMessages] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch messages') }
    }

    const messages = (data || []).map(row => {
      const attachments = row.message_attachments as unknown as Tables<'message_attachments'>[]
      return mapDbToMessage(row, attachments)
    })

    return { success: true, data: messages.reverse() }
  } catch (e) {
    console.error('[getMessages] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET MESSAGES (Client Portal)
// ============================================

export async function getClientMessages(
  clientId: string,
  photographerId: string,
  options?: { limit?: number; before?: string }
): Promise<ActionResult<Message[]>> {
  const { limit = 50, before } = options || {}

  try {
    let query = supabaseAdmin
      .from('messages')
      .select('*, message_attachments(*)')
      .eq('client_id', clientId)
      .eq('photographer_id', photographerId)
      .is('deleted_at', null)
      .eq('deleted_by_client', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getClientMessages] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch messages') }
    }

    const messages = (data || []).map(row => {
      const attachments = row.message_attachments as unknown as Tables<'message_attachments'>[]
      return mapDbToMessage(row, attachments)
    })

    return { success: true, data: messages.reverse() }
  } catch (e) {
    console.error('[getClientMessages] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// MARK MESSAGES READ (Photographer)
// ============================================

export async function markMessagesRead(
  clientId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    const { error } = await supabaseAdmin
      .from('messages')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('client_id', clientId)
      .eq('photographer_id', user.id)
      .eq('is_from_photographer', false)
      .neq('status', 'read')

    if (error) {
      console.error('[markMessagesRead] Error:', error)
    }

    revalidatePath(`/dashboard/clients/${clientId}`)

    return { success: true }
  } catch (e) {
    console.error('[markMessagesRead] Exception:', e)
    return { success: true } // Don't fail on tracking errors
  }
}

// ============================================
// MARK MESSAGES READ (Client Portal)
// ============================================

export async function markClientMessagesRead(
  clientId: string,
  photographerId: string
): Promise<ActionResult> {
  try {
    const { error } = await supabaseAdmin
      .from('messages')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('client_id', clientId)
      .eq('photographer_id', photographerId)
      .eq('is_from_photographer', true)
      .neq('status', 'read')

    if (error) {
      console.error('[markClientMessagesRead] Error:', error)
    }

    return { success: true }
  } catch (e) {
    console.error('[markClientMessagesRead] Exception:', e)
    return { success: true }
  }
}

// ============================================
// GET MESSAGE THREADS
// ============================================

export async function getMessageThreads(): Promise<ActionResult<MessageThread[]>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    // Get all clients with messages
    const { data: clients } = await supabaseAdmin
      .from('client_profiles')
      .select('id, first_name, last_name, email')
      .eq('photographer_id', user.id)
      .eq('is_archived', false)

    if (!clients || clients.length === 0) {
      return { success: true, data: [] }
    }

    const clientIds = clients.map(c => c.id)

    // Get latest message per client
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('client_id, content, created_at, is_from_photographer, status')
      .eq('photographer_id', user.id)
      .in('client_id', clientIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Get unread counts
    const { data: unreadCounts } = await supabaseAdmin
      .from('messages')
      .select('client_id')
      .eq('photographer_id', user.id)
      .eq('is_from_photographer', false)
      .neq('status', 'read')
      .is('deleted_at', null)

    // Build thread map
    type MessagePreview = { client_id: string; content: string; created_at: string; is_from_photographer: boolean; status: string }
    const latestMessageMap = new Map<string, MessagePreview>()
    messages?.forEach(m => {
      if (!latestMessageMap.has(m.client_id)) {
        latestMessageMap.set(m.client_id, m)
      }
    })

    const unreadMap = new Map<string, number>()
    unreadCounts?.forEach(m => {
      unreadMap.set(m.client_id, (unreadMap.get(m.client_id) || 0) + 1)
    })

    // Build threads (only for clients with messages)
    const threads: MessageThread[] = clients
      .filter(c => latestMessageMap.has(c.id))
      .map(client => {
        const lastMsg = latestMessageMap.get(client.id)
        if (!lastMsg) return null
        return {
          clientId: client.id,
          clientName: `${client.first_name} ${client.last_name}`,
          clientEmail: client.email,
          lastMessage: lastMsg.content.substring(0, 100),
          lastMessageAt: lastMsg.created_at,
          unreadCount: unreadMap.get(client.id) || 0,
          isFromPhotographer: lastMsg.is_from_photographer,
        }
      })
      .filter((t): t is MessageThread => t !== null)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

    return { success: true, data: threads }
  } catch (e) {
    console.error('[getMessageThreads] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// DELETE MESSAGE
// ============================================

export async function deleteMessage(
  messageId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    const { error } = await supabaseAdmin
      .from('messages')
      .update({
        deleted_by_photographer: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('photographer_id', user.id)

    if (error) {
      console.error('[deleteMessage] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to delete message') }
    }

    return { success: true }
  } catch (e) {
    console.error('[deleteMessage] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET UNREAD COUNT
// ============================================

export async function getUnreadMessageCount(): Promise<ActionResult<number>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', user.id)
      .eq('is_from_photographer', false)
      .neq('status', 'read')
      .is('deleted_at', null)

    if (error) {
      console.error('[getUnreadMessageCount] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to get unread count') }
    }

    return { success: true, data: count || 0 }
  } catch (e) {
    console.error('[getUnreadMessageCount] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}
