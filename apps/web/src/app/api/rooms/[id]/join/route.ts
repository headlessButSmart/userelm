import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { signRoomToken } from '@/lib/jwt'
import { getTurnServers } from '@/lib/turn'
import { JoinRoomSchema } from '@p2p-crm/shared'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = JoinRoomSchema.parse(await req.json())

    const doc = await db.collection('rooms').doc(id).get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    const room = doc.data()!

    if (room['isSuspended']) {
      return NextResponse.json({ error: 'This workspace has been suspended' }, { status: 403 })
    }

    const valid = await bcrypt.compare(body.secret, room['hashedSecret'])
    if (!valid) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    await db.collection('rooms').doc(id).update({ lastActiveAt: new Date() })

    const token = await signRoomToken({
      roomId: id,
      userId: body.userId,
      displayName: body.displayName,
    })

    return NextResponse.json({
      token,
      signalingUrl: 'wss://signaling.yjs.dev',
      iceServers: getTurnServers(body.userId),
      workspaceName: room['workspaceName'],
    })
  } catch (err) {
    if ((err as any)?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error('POST /api/rooms/[id]/join', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
