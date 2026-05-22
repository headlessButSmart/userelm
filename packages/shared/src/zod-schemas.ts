import { z } from 'zod'

export const CreateRoomSchema = z.object({
  workspaceName: z.string().min(1).max(80),
  ownerEmail: z.string().email(),
  turnstileToken: z.string(),
})

export const JoinRoomSchema = z.object({
  secret: z.string().min(1),
  displayName: z.string().min(1).max(40),
  userId: z.string().min(1),
})

export const AbuseReportSchema = z.object({
  roomId: z.string().min(1),
  reason: z.enum(['spam', 'illegal', 'harassment', 'other']),
  details: z.string().max(2000).optional(),
  reporterEmail: z.string().email().optional(),
})
