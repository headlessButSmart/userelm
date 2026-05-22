import type { Timestamp } from 'firebase-admin/firestore'

export interface Room {
  hashedSecret: string
  workspaceName: string
  ownerEmail: string
  createdAt: Timestamp
  lastActiveAt: Timestamp
  isSuspended: boolean
  suspendReason: string | null
}

export interface AbuseReport {
  roomId: string
  reporterIp: string | null
  reporterEmail: string | null
  reason: string
  details: string | null
  createdAt: Timestamp
  resolvedAt: Timestamp | null
}

export interface RateLimitBucket {
  count: number
  windowStart: Timestamp
}
