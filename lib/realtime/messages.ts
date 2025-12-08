/**
 * Real-time Messaging
 * 
 * Supabase Realtime subscription hooks for live messaging.
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Message } from '@/server/actions/message.actions'

// Create a client-side Supabase client for realtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

interface UseRealtimeMessagesOptions {
  clientId: string
  photographerId: string
  onNewMessage?: (message: Message) => void
  onMessageUpdate?: (message: Message) => void
}

/**
 * Hook to subscribe to real-time message updates
 */
export function useRealtimeMessages({
  clientId,
  photographerId,
  onNewMessage,
  onMessageUpdate,
}: UseRealtimeMessagesOptions) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const newMessage = mapPayloadToMessage(payload.new)
          onNewMessage?.(newMessage)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const updatedMessage = mapPayloadToMessage(payload.new)
          onMessageUpdate?.(updatedMessage)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId, photographerId, onNewMessage, onMessageUpdate])

  return { isConnected }
}

interface UseTypingIndicatorOptions {
  clientId: string
  photographerId: string
  isPhotographer: boolean
}

/**
 * Hook to manage typing indicators
 */
export function useTypingIndicator({
  clientId,
  photographerId,
  isPhotographer,
}: UseTypingIndicatorOptions) {
  const [isOtherTyping, setIsOtherTyping] = useState(false)

  const setTyping = useCallback(async (isTyping: boolean) => {
    const supabase = getSupabaseClient()

    if (isTyping) {
      // Using any to bypass type checking since typing_indicators isn't in the generated types yet
      await (supabase.from('typing_indicators') as any).upsert({
        client_id: clientId,
        photographer_id: photographerId,
        is_photographer: isPhotographer,
        started_at: new Date().toISOString(),
      })
    } else {
      await (supabase.from('typing_indicators') as any)
        .delete()
        .eq('client_id', clientId)
        .eq('photographer_id', photographerId)
        .eq('is_photographer', isPhotographer)
    }
  }, [clientId, photographerId, isPhotographer])

  useEffect(() => {
    const supabase = getSupabaseClient()

    const channel = supabase
      .channel(`typing:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setIsOtherTyping(false)
          } else {
            const indicator = payload.new as { is_photographer: boolean }
            // Only show if it's from the other party
            if (indicator.is_photographer !== isPhotographer) {
              setIsOtherTyping(true)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId, isPhotographer])

  // Clear typing indicator on unmount
  useEffect(() => {
    return () => {
      setTyping(false)
    }
  }, [setTyping])

  return { isOtherTyping, setTyping }
}

// Helper to map database payload to Message type
function mapPayloadToMessage(payload: Record<string, unknown>): Message {
  return {
    id: payload.id as string,
    clientId: payload.client_id as string,
    photographerId: payload.photographer_id as string,
    isFromPhotographer: payload.is_from_photographer as boolean,
    messageType: payload.message_type as Message['messageType'],
    content: payload.content as string,
    status: payload.status as Message['status'],
    createdAt: payload.created_at as string,
    deliveredAt: payload.delivered_at as string | null,
    readAt: payload.read_at as string | null,
  }
}
