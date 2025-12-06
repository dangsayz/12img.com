'use server'

import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface SupportMessage {
  id: string
  conversation_id: string
  sender_type: 'user' | 'admin'
  sender_id: string
  message: string
  read_at: string | null
  created_at: string
}

export interface SupportConversation {
  id: string
  user_id: string
  status: 'open' | 'resolved'
  subject: string | null
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
  user_plan?: string
  user_business_name?: string
  user_joined_at?: string
  messages?: SupportMessage[]
  unread_count?: number
  last_message?: SupportMessage
}

// Get or create a conversation for the current user
export async function getOrCreateConversation(): Promise<{
  success: boolean
  conversation?: SupportConversation
  error?: string
}> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = supabaseAdmin

  // Get user's internal ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (userError || !user) {
    return { success: false, error: 'User not found' }
  }

  // Use the database function to get or create conversation
  const { data: conversationId, error: convError } = await supabase
    .rpc('get_or_create_support_conversation', { p_user_id: user.id })

  if (convError) {
    console.error('Error getting conversation:', convError)
    return { success: false, error: 'Failed to get conversation' }
  }

  // Fetch the conversation with messages
  const { data: conversation, error: fetchError } = await supabase
    .from('support_conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (fetchError) {
    return { success: false, error: 'Failed to fetch conversation' }
  }

  // Get messages
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return {
    success: true,
    conversation: {
      ...conversation,
      messages: messages || [],
    },
  }
}

// Send a message
export async function sendSupportMessage(
  conversationId: string,
  message: string
): Promise<{ success: boolean; message?: SupportMessage; error?: string }> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!message.trim()) {
    return { success: false, error: 'Message cannot be empty' }
  }

  const supabase = supabaseAdmin

  // Get user's internal ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (userError || !user) {
    return { success: false, error: 'User not found' }
  }

  // Insert the message
  const { data: newMessage, error } = await supabase
    .from('support_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'user',
      sender_id: user.id,
      message: message.trim(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return { success: false, error: 'Failed to send message' }
  }

  // Update conversation timestamp
  await supabase
    .from('support_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  revalidatePath('/admin/support')

  return { success: true, message: newMessage }
}

// Get user's messages (for the widget)
export async function getUserMessages(): Promise<{
  success: boolean
  messages?: SupportMessage[]
  conversationId?: string
  conversationStatus?: 'open' | 'resolved'
  error?: string
}> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = supabaseAdmin

  // Get user's internal ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    return { success: true, messages: [] }
  }

  // Get most recent conversation (open or resolved)
  const { data: conversation } = await supabase
    .from('support_conversations')
    .select('id, status')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!conversation) {
    return { success: true, messages: [] }
  }

  // Get messages
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  return {
    success: true,
    messages: messages || [],
    conversationId: conversation.id,
    conversationStatus: conversation.status as 'open' | 'resolved',
  }
}

// Start a new conversation (for users after previous was resolved)
export async function startNewConversation(): Promise<{
  success: boolean
  conversationId?: string
  error?: string
}> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = supabaseAdmin

  // Get user's internal ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (userError || !user) {
    return { success: false, error: 'User not found' }
  }

  // Create a new conversation
  const { data: conversation, error } = await supabase
    .from('support_conversations')
    .insert({ user_id: user.id, status: 'open' })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return { success: false, error: 'Failed to create conversation' }
  }

  return { success: true, conversationId: conversation.id }
}

// === ADMIN ACTIONS ===

// Get all conversations (admin only)
export async function getAllConversations(): Promise<{
  success: boolean
  conversations?: SupportConversation[]
  error?: string
}> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = supabaseAdmin

  // Check if user is admin
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single()

  if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role || '')) {
    return { success: false, error: 'Not authorized' }
  }

  // Get all conversations with user info
  const { data: conversations, error } = await supabase
    .from('support_conversations')
    .select(`
      *,
      users!support_conversations_user_id_fkey (
        id,
        email,
        plan,
        created_at
      )
    `)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return { success: false, error: 'Failed to fetch conversations' }
  }

  // Get last message and unread count for each conversation
  const enrichedConversations = await Promise.all(
    (conversations || []).map(async (conv: any) => {
      const { data: messages } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('sender_type', 'user')
        .is('read_at', null)

      return {
        ...conv,
        user_email: conv.users?.email,
        user_plan: conv.users?.plan,
        user_joined_at: conv.users?.created_at,
        last_message: messages?.[0],
        unread_count: count || 0,
      }
    })
  )

  return { success: true, conversations: enrichedConversations }
}

// Get single conversation with all messages (admin)
export async function getConversationById(conversationId: string): Promise<{
  success: boolean
  conversation?: SupportConversation
  error?: string
}> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = supabaseAdmin

  // Check if user is admin
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single()

  if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role || '')) {
    return { success: false, error: 'Not authorized' }
  }

  // Get conversation with user info and settings
  const { data: conversation, error } = await supabase
    .from('support_conversations')
    .select(`
      *,
      users!support_conversations_user_id_fkey (
        id,
        email,
        plan,
        created_at
      )
    `)
    .eq('id', conversationId)
    .single()

  // Get user settings for business name
  let businessName: string | null = null
  if (conversation?.users?.id) {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('business_name')
      .eq('user_id', conversation.users.id)
      .single()
    businessName = settings?.business_name || null
  }

  if (error || !conversation) {
    return { success: false, error: 'Conversation not found' }
  }

  // Get all messages
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  // Mark user messages as read
  await supabase
    .from('support_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('sender_type', 'user')
    .is('read_at', null)

  return {
    success: true,
    conversation: {
      ...conversation,
      user_email: (conversation as any).users?.email,
      user_plan: (conversation as any).users?.plan,
      user_joined_at: (conversation as any).users?.created_at,
      user_business_name: businessName,
      messages: messages || [],
    },
  }
}

// Send admin reply
export async function sendAdminReply(
  conversationId: string,
  message: string
): Promise<{ success: boolean; message?: SupportMessage; error?: string }> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!message.trim()) {
    return { success: false, error: 'Message cannot be empty' }
  }

  const supabase = supabaseAdmin

  // Check if user is admin and get their ID
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single()

  if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role || '')) {
    return { success: false, error: 'Not authorized' }
  }

  // Insert the message
  const { data: newMessage, error } = await supabase
    .from('support_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'admin',
      sender_id: adminUser.id,
      message: message.trim(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending reply:', error)
    return { success: false, error: 'Failed to send reply' }
  }

  // Update conversation timestamp
  await supabase
    .from('support_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  revalidatePath('/admin/support')

  return { success: true, message: newMessage }
}

// Update conversation status
export async function updateConversationStatus(
  conversationId: string,
  status: 'open' | 'resolved'
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = supabaseAdmin

  // Check if user is admin
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single()

  if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role || '')) {
    return { success: false, error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('support_conversations')
    .update({ status })
    .eq('id', conversationId)

  if (error) {
    return { success: false, error: 'Failed to update status' }
  }

  revalidatePath('/admin/support')

  return { success: true }
}
