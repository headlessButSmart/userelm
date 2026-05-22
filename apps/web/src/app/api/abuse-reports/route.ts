import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { db } from '@/db'
import { rateLimit, RateLimitError } from '@/lib/rate-limit'
import { AbuseReportSchema } from '@p2p-crm/shared'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    await rateLimit(`abuse-report:ip:${ip}`, 3, 60 * 60)

    const body = AbuseReportSchema.parse(await req.json())

    await db.collection('abuse-reports').doc(nanoid()).set({
      roomId: body.roomId,
      reporterIp: ip,
      reporterEmail: body.reporterEmail ?? null,
      reason: body.reason,
      details: body.details ?? null,
      createdAt: new Date(),
      resolvedAt: null,
    })

    // Auto-suspend if >=3 distinct IPs have reported this room
    const snap = await db
      .collection('abuse-reports')
      .where('roomId', '==', body.roomId)
      .get()

    const distinctIps = new Set(
      snap.docs.map((d) => d.data()['reporterIp']).filter(Boolean),
    )

    if (distinctIps.size >= 3) {
      await db.collection('rooms').doc(body.roomId).update({
        isSuspended: true,
        suspendReason: 'Auto-suspended: multiple abuse reports',
      })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    if ((err as any)?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error('POST /api/abuse-reports', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
