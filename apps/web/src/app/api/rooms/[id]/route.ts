import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const doc = await db.collection('rooms').doc(id).get()
    if (!doc.exists) {
      return NextResponse.json({ exists: false })
    }
    const r = doc.data()!
    return NextResponse.json({
      exists: true,
      workspaceName: r['workspaceName'],
      isSuspended: r['isSuspended'],
    })
  } catch (err) {
    console.error('GET /api/rooms/[id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
