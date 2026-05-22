'use client'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { X, Send, Reply, Trash2, Edit2, Smile, CornerUpLeft } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  type MessageRow,
} from '@p2p-crm/platform'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const REACTIONS = ['👍', '👎', '❤️', '😄', '🎉', '🚀']

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 0) return 'just now'
  const s = Math.floor(diff / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}

export function ChatPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { doc, identity, workspaceName } = useRoom()
  useYMapDeep(doc.getMap('chatMessages'))
  const messages = getMessages(doc)

  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [pickerFor, setPickerFor] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastCount = useRef(0)

  // Auto-scroll on new messages or first open
  useLayoutEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (!el) return
    const isNew = messages.length !== lastCount.current
    lastCount.current = messages.length
    if (isNew) {
      el.scrollTop = el.scrollHeight
    }
  }, [open, messages.length])

  useEffect(() => {
    if (open) {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [open])

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const max = 5 * 24 // ~5 rows
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px'
  }, [body])

  const handleSend = () => {
    const trimmed = body.trim()
    if (!trimmed) return
    sendMessage(doc, {
      body: trimmed,
      authorId: identity.userId,
      authorName: identity.displayName,
      replyTo: replyTo?.id,
    })
    setBody('')
    setReplyTo(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEditSave = (id: string) => {
    const trimmed = editingBody.trim()
    if (trimmed) editMessage(doc, id, trimmed)
    setEditingId(null)
    setEditingBody('')
  }

  const messageMap = new Map(messages.map((m) => [m.id, m]))

  return (
    <>
      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full flex-col bg-card shadow-2xl border-l border-[--color-border] transition-transform duration-200 ease-out',
          'w-full md:w-[380px]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!open}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[--color-border]">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Chat</div>
            <div className="text-sm font-semibold truncate">{workspaceName}</div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close chat">
            <X className="h-4 w-4" />
          </Button>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground pt-8">
              No messages yet. Say hello!
            </div>
          )}
          {messages.map((m) => {
            const isOwn = m.authorId === identity.userId
            const replyMsg = m.replyTo ? messageMap.get(m.replyTo) : undefined
            const isEditing = editingId === m.id
            return (
              <div
                key={m.id}
                className={cn(
                  'group flex gap-2',
                  isOwn ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                <Avatar name={m.authorName} size="sm" />
                <div
                  className={cn(
                    'flex-1 min-w-0 flex flex-col',
                    isOwn ? 'items-end' : 'items-start',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-baseline gap-2 text-[11px] text-muted-foreground',
                      isOwn && 'flex-row-reverse',
                    )}
                  >
                    <span className="font-medium text-foreground">{m.authorName}</span>
                    <span>{relativeTime(m.createdAt)}</span>
                    {m.editedAt > 0 && <span className="italic">(edited)</span>}
                  </div>

                  {replyMsg && (
                    <div
                      className={cn(
                        'mt-1 text-[11px] px-2 py-1 rounded border-l-2 bg-[--color-muted]/40 max-w-[85%] truncate',
                        isOwn ? 'border-r-2 border-l-0 text-right' : 'border-l-2',
                      )}
                    >
                      <span className="font-medium">{replyMsg.authorName}: </span>
                      <span className="text-muted-foreground">{replyMsg.body}</span>
                    </div>
                  )}

                  <div
                    className={cn(
                      'mt-1 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words max-w-[85%]',
                      isOwn
                        ? 'bg-[--color-primary] text-[--color-primary-foreground]'
                        : 'bg-[--color-muted] text-foreground',
                    )}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          value={editingBody}
                          onChange={(e) => setEditingBody(e.target.value)}
                          className="bg-background text-foreground rounded p-1 text-sm w-full resize-none"
                          rows={2}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleEditSave(m.id)
                            } else if (e.key === 'Escape') {
                              setEditingId(null)
                            }
                          }}
                        />
                        <div className="flex gap-1 justify-end">
                          <button
                            className="text-[10px] underline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="text-[10px] underline font-semibold"
                            onClick={() => handleEditSave(m.id)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      m.body
                    )}
                  </div>

                  {/* Reactions */}
                  {Object.keys(m.reactions ?? {}).length > 0 && (
                    <div
                      className={cn(
                        'mt-1 flex flex-wrap gap-1',
                        isOwn && 'justify-end',
                      )}
                    >
                      {Object.entries(m.reactions).map(([emoji, users]) => {
                        const arr = users as string[]
                        if (!arr || arr.length === 0) return null
                        const mine = arr.includes(identity.userId)
                        return (
                          <button
                            key={emoji}
                            onClick={() =>
                              toggleReaction(doc, m.id, emoji, identity.userId)
                            }
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border transition-colors',
                              mine
                                ? 'bg-[--color-primary]/20 border-[--color-primary]/40'
                                : 'bg-background border-[--color-border] hover:bg-[--color-muted]',
                            )}
                          >
                            <span>{emoji}</span>
                            <span>{arr.length}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Hover actions */}
                  <div
                    className={cn(
                      'mt-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                      isOwn && 'flex-row-reverse',
                    )}
                  >
                    <button
                      onClick={() => setReplyTo(m)}
                      title="Reply"
                      className="p-1 rounded hover:bg-[--color-muted] text-muted-foreground"
                    >
                      <Reply className="h-3 w-3" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setPickerFor(pickerFor === m.id ? null : m.id)
                        }
                        title="React"
                        className="p-1 rounded hover:bg-[--color-muted] text-muted-foreground"
                      >
                        <Smile className="h-3 w-3" />
                      </button>
                      {pickerFor === m.id && (
                        <div
                          className={cn(
                            'absolute z-10 mt-1 flex gap-1 rounded-md border border-[--color-border] bg-card p-1 shadow-lg',
                            isOwn ? 'right-0' : 'left-0',
                          )}
                        >
                          {REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                toggleReaction(doc, m.id, emoji, identity.userId)
                                setPickerFor(null)
                              }}
                              className="hover:bg-[--color-muted] rounded px-1 text-sm"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {isOwn && (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(m.id)
                            setEditingBody(m.body)
                          }}
                          title="Edit"
                          className="p-1 rounded hover:bg-[--color-muted] text-muted-foreground"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this message?')) {
                              deleteMessage(doc, m.id)
                            }
                          }}
                          title="Delete"
                          className="p-1 rounded hover:bg-[--color-muted] text-muted-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reply banner */}
        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-[--color-border] bg-[--color-muted]/40 text-xs">
            <CornerUpLeft className="h-3 w-3 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <span className="font-medium">Replying to {replyTo.authorName}: </span>
              <span className="text-muted-foreground">{replyTo.body}</span>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 rounded hover:bg-[--color-muted]"
              aria-label="Cancel reply"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-[--color-border] p-3 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message…"
            rows={1}
            className="flex-1 resize-none rounded-md bg-background border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] max-h-[120px] overflow-y-auto"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!body.trim()}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </aside>
    </>
  )
}
