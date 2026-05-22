import { SignJWT, jwtVerify } from 'jose'
import type { RoomToken } from '@p2p-crm/shared'

const secret = () => new TextEncoder().encode(process.env['JWT_SECRET']!)
const ISSUER = process.env['JWT_ISSUER'] ?? 'p2p-crm'

export async function signRoomToken(payload: Omit<RoomToken, 'iat' | 'exp' | 'iss'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime('24h')
    .sign(secret())
}

export async function verifyRoomToken(token: string): Promise<RoomToken> {
  const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER })
  return payload as unknown as RoomToken
}
