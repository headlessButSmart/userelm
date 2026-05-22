'use client'
import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import { getUnreadCount } from '@p2p-crm/platform'
import { ChatPanel } from './ChatPanel'
import { cn } from '@/lib/utils'

export function ChatLauncher() {
  const { doc, roomId, identity } = useRoom()
  useYMapDeep(doc.getMap('chatMessages'))

  const [open, setOpen] = useState(false)
  const [lastRead, setLastRead] = useState<number>(0)
  const storageKey = `chat-lastread:${roomId}`

  // Load lastRead from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setLastRead(raw ? Number(raw) || 0 : 0)
    } catch {
      setLastRead(0)
    }
  }, [storageKey])

  // When panel opens, mark as read
  useEffect(() => {
    if (open) {
      const now = Date.now()
      setLastRead(now)
      try {
        localStorage.setItem(storageKey, String(now))
      } catch {
        /* ignore */
      }
    }
  }, [open, storageKey])

  const unread = open ? 0 : getUnreadCount(doc, lastRead, identity.userId)

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'grad-primary fixed bottom-5 right-5 z-30 flex h-[52px] w-[52px] items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95',
        )}
        aria-label="Toggle chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      <ChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
