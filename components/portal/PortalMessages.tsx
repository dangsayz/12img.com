'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { type PortalData } from '@/server/actions/portal.actions'
import { type Message, sendClientMessage } from '@/server/actions/message.actions'
import { MessageThread } from '@/components/messages/MessageThread'

interface PortalMessagesProps {
  data: PortalData
  messages: Message[]
  token: string
}

export function PortalMessages({ data, messages, token }: PortalMessagesProps) {
  const { client, photographerName } = data
  const [isPending, startTransition] = useTransition()

  const handleSendMessage = async (content: string) => {
    startTransition(async () => {
      await sendClientMessage(client.id, client.photographerId, content)
    })
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/portal/${token}`}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-500" />
          </Link>
          <div className="flex-1">
            <h1 className="font-medium text-stone-900">{photographerName}</h1>
            <p className="text-xs text-stone-500">Messages</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 max-w-3xl w-full mx-auto bg-white border-x border-stone-200">
        <MessageThread
          clientId={client.id}
          clientName={photographerName}
          initialMessages={messages}
          isPortal={true}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  )
}
