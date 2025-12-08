import { NextRequest, NextResponse } from 'next/server'
import { createCampaign } from '@/server/admin/emails'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const campaign = await createCampaign({
      name: body.name,
      subject: body.subject,
      preview_text: body.preview_text,
      html_content: body.html_content,
      text_content: body.text_content,
      status: body.status || 'draft',
      segment_filter: body.segment_filter || {},
      tags_filter: body.tags_filter || [],
      scheduled_at: body.scheduled_at || null,
      sent_at: null,
      completed_at: null,
      created_by: null, // Will be set by createCampaign
    })
    
    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
