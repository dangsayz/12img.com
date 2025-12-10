import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { markAllNotificationsRead } from '@/server/admin/notifications'
import { getUserByClerkId } from '@/server/queries/user.queries'

export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserByClerkId(clerkId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const count = await markAllNotificationsRead(user.id)
    
    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
