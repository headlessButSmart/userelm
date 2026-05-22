import { db } from '@/db'
import { FieldValue } from 'firebase-admin/firestore'

export class RateLimitError extends Error {
  status = 429
  constructor() {
    super('Rate limit exceeded')
  }
}

export async function rateLimit(key: string, limit: number, windowSec: number) {
  // Skip rate limiting in development
  if (process.env['NODE_ENV'] === 'development') return
  const now = Date.now()
  const windowStart = now - windowSec * 1000
  const ref = db.collection('rate-limit-buckets').doc(key)

  // 1% chance: clean up expired buckets (fire-and-forget)
  if (Math.random() < 0.01) {
    db.collection('rate-limit-buckets')
      .where('windowStart', '<', new Date(windowStart))
      .get()
      .then((snap) => {
        const batch = db.batch()
        snap.docs.forEach((doc) => batch.delete(doc.ref))
        return batch.commit()
      })
      .catch(() => {})
  }

  await db.runTransaction(async (t) => {
    const doc = await t.get(ref)

    if (!doc.exists || doc.data()!.windowStart.toMillis() < windowStart) {
      t.set(ref, { count: 1, windowStart: new Date(now) })
      return
    }

    if (doc.data()!.count >= limit) throw new RateLimitError()

    t.update(ref, { count: FieldValue.increment(1) })
  })
}
