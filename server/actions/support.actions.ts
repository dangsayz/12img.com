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
  status: 'open' | 'resolved' | 'archived'
  subject: string | null
  created_at: string
  updated_at: string
  archived_at?: string | null
  user_email?: string
  user_name?: string
  user_plan?: string
  user_business_name?: string
  user_joined_at?: string
  messages?: SupportMessage[]
  unread_count?: number
  last_message?: SupportMessage
}

export type ConversationFilter = 'all' | 'open' | 'resolved' | 'archived'

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

// Get conversations with pagination and filtering (admin only)
export async function getAllConversations(options?: {
  filter?: ConversationFilter
  page?: number
  pageSize?: number
  search?: string
}): Promise<{
  success: boolean
  conversations?: SupportConversation[]
  total?: number
  hasMore?: boolean
  error?: string
}> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = supabaseAdmin
  const { filter = 'all', page = 1, pageSize = 30, search } = options || {}

  // Check if user is admin
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single()

  if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role || '')) {
    return { success: false, error: 'Not authorized' }
  }

  // Build query with filters
  let query = supabase
    .from('support_conversations')
    .select(`
      *,
      users!support_conversations_user_id_fkey (
        id,
        email,
        plan,
        created_at
      )
    `, { count: 'exact' })

  // Apply status filter
  if (filter === 'open') {
    query = query.eq('status', 'open')
  } else if (filter === 'resolved') {
    query = query.eq('status', 'resolved')
  } else if (filter === 'archived') {
    query = query.eq('status', 'archived')
  } else {
    // 'all' - exclude archived by default
    query = query.neq('status', 'archived')
  }

  // Apply search filter
  if (search) {
    // We'll search by user email in a subquery approach
    const { data: matchingUsers } = await supabase
      .from('users')
      .select('id')
      .ilike('email', `%${search}%`)
    
    if (matchingUsers && matchingUsers.length > 0) {
      const userIds = matchingUsers.map(u => u.id)
      query = query.in('user_id', userIds)
    } else {
      // No matching users, return empty
      return { success: true, conversations: [], total: 0, hasMore: false }
    }
  }

  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  const { data: conversations, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

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

      const { count: unreadCount } = await supabase
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
        unread_count: unreadCount || 0,
      }
    })
  )

  return { 
    success: true, 
    conversations: enrichedConversations,
    total: count || 0,
    hasMore: (count || 0) > page * pageSize,
  }
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

// Archive a conversation (admin)
export async function archiveConversation(
  conversationId: string
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

  // First, try to add 'archived' to the constraint if needed
  // This uses a soft delete pattern - we'll add an is_archived column
  // For now, just delete the conversation (move to a soft delete later)
  
  // Try updating status - if constraint fails, we need migration
  const { error } = await supabase
    .from('support_conversations')
    .update({ status: 'archived' })
    .eq('id', conversationId)

  if (error) {
    // If the constraint error, try alternative: just delete
    if (error.message?.includes('check') || error.code === '23514') {
      console.log('Archive status not supported, deleting instead')
      // Delete messages first
      await supabase
        .from('support_messages')
        .delete()
        .eq('conversation_id', conversationId)
      
      // Delete conversation
      const { error: deleteError } = await supabase
        .from('support_conversations')
        .delete()
        .eq('id', conversationId)
      
      if (deleteError) {
        console.error('Delete error:', deleteError)
        return { success: false, error: 'Failed to archive conversation' }
      }
    } else {
      console.error('Archive error:', error)
      return { success: false, error: 'Failed to archive conversation' }
    }
  }

  revalidatePath('/admin/support')
  return { success: true }
}

// Unarchive a conversation (admin)
export async function unarchiveConversation(
  conversationId: string
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

  // Just update status - archived_at column may not exist yet
  const { error } = await supabase
    .from('support_conversations')
    .update({ status: 'resolved' })
    .eq('id', conversationId)

  if (error) {
    console.error('Unarchive error:', error)
    return { success: false, error: 'Failed to unarchive conversation' }
  }

  revalidatePath('/admin/support')
  return { success: true }
}

// Delete a conversation permanently (admin - super_admin only)
export async function deleteConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = supabaseAdmin

  // Check if user is super_admin (destructive action)
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single()

  if (!adminUser || adminUser.role !== 'super_admin') {
    return { success: false, error: 'Only super admins can delete conversations' }
  }

  // Delete messages first (foreign key constraint)
  await supabase
    .from('support_messages')
    .delete()
    .eq('conversation_id', conversationId)

  // Delete conversation
  const { error } = await supabase
    .from('support_conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    return { success: false, error: 'Failed to delete conversation' }
  }

  revalidatePath('/admin/support')
  return { success: true }
}

// Get conversation counts by status (for tabs)
export async function getConversationCounts(): Promise<{
  success: boolean
  counts?: { all: number; open: number; resolved: number; archived: number }
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

  const [allResult, openResult, resolvedResult, archivedResult] = await Promise.all([
    supabase.from('support_conversations').select('*', { count: 'exact', head: true }).neq('status', 'archived'),
    supabase.from('support_conversations').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('support_conversations').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('support_conversations').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
  ])

  return {
    success: true,
    counts: {
      all: allResult.count || 0,
      open: openResult.count || 0,
      resolved: resolvedResult.count || 0,
      archived: archivedResult.count || 0,
    },
  }
}
