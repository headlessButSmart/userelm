export const CHAT_KEYS = {
  messages: 'chatMessages',
} as const

export interface MessageRow {
  id: string
  body: string
  authorId: string
  authorName: string
  /** Optional id of the message this is replying to */
  replyTo: string
  /** Optional emoji reactions: { '👍': ['userId1', 'userId2'] } */
  reactions: Record<string, string[]>
  editedAt: number
  createdAt: number
}
