const memberKey = (roomId: string) => `room-members:${roomId}`

export interface RoomMember {
  userId: string
  displayName: string
  email: string
  seenAt: number
}

export function getRoomMembers(roomId: string): RoomMember[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(memberKey(roomId)) ?? '[]') as RoomMember[]
  } catch {
    return []
  }
}

export function upsertRoomMember(
  roomId: string,
  member: Omit<RoomMember, 'seenAt'> & { seenAt?: number },
) {
  if (typeof window === 'undefined') return
  const list = getRoomMembers(roomId)
  const idx = list.findIndex((m) => m.userId === member.userId)
  const entry: RoomMember = { ...member, seenAt: member.seenAt ?? Date.now() }
  if (idx >= 0) list[idx] = entry
  else list.push(entry)
  localStorage.setItem(memberKey(roomId), JSON.stringify(list))
}
