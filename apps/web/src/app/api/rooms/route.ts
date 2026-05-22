import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { rateLimit, RateLimitError } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { CreateRoomSchema } from '@p2p-crm/shared'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    const body = CreateRoomSchema.parse(await req.json())

    await verifyTurnstile(body.turnstileToken, ip)
    await rateLimit(`create-room:ip:${ip}`, 10, 60 * 60)
    await rateLimit(`create-room:email:${body.ownerEmail}`, 10, 24 * 60 * 60)

    const roomId = nanoid(12)
    const secret = nanoid(32)
    const hashedSecret = await bcrypt.hash(secret, 10)

    await db.collection('rooms').doc(roomId).set({
      hashedSecret,
      workspaceName: body.workspaceName,
      ownerEmail: body.ownerEmail,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isSuspended: false,
      suspendReason: null,
    })

    const joinUrl = `${process.env['NEXT_PUBLIC_APP_URL']}/join#room=${roomId}&key=${secret}`
    return NextResponse.json({ roomId, joinUrl, secret })
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    if ((err as any)?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error('POST /api/rooms', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
