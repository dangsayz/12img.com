/**
 * Admin Feature Flag CRUD API
 * PATCH /api/admin/flags/[id] - Update a flag
 * DELETE /api/admin/flags/[id] - Delete a flag
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateFeatureFlag, deleteFeatureFlag } from '@/server/admin/flags'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    await updateFeatureFlag(id, body, body.reason)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update flag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update flag' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await deleteFeatureFlag(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete flag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete flag' },
      { status: 500 }
    )
  }
}
