import { Suspense } from 'react'
import { getMessageThreads } from '@/server/actions/message.actions'
import { MessagesPageContent } from '@/components/messages/MessagesPageContent'

export const metadata = {
  title: 'Messages | 12IMG',
  description: 'Client messaging',
}

async function MessagesData() {
  const result = await getMessageThreads()

  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-stone-500">Failed to load messages</p>
      </div>
    )
  }

  return <MessagesPageContent threads={result.data} />
}

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-pulse text-stone-400">Loading messages...</div>
            </div>
          }
        >
          <MessagesData />
        </Suspense>
      </div>
    </div>
  )
}
