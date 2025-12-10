import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { markNotificationRead } from '@/server/admin/notifications'
import { getUserByClerkId } from '@/server/queries/user.queries'

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserByClerkId(clerkId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 })
    }

    const success = await markNotificationRead(notificationId, user.id)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
