export interface RoomToken {
  roomId: string
  userId: string
  displayName: string
  iat: number
  exp: number
  iss: 'p2p-crm'
}

export interface CreateRoomRequest {
  workspaceName: string
  ownerEmail: string
  turnstileToken: string
}

export interface CreateRoomResponse {
  roomId: string
  joinUrl: string
  secret: string
}

export interface RoomMetaResponse {
  exists: boolean
  workspaceName?: string
  isSuspended?: boolean
}

export interface JoinRoomRequest {
  secret: string
  displayName: string
  userId: string
}

export interface JoinRoomResponse {
  token: string
  signalingUrl: string
  iceServers: RTCIceServer[]
  workspaceName: string
}

export interface AbuseReportRequest {
  roomId: string
  reason: 'spam' | 'illegal' | 'harassment' | 'other'
  details?: string
  reporterEmail?: string
}
