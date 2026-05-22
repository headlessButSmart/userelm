'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { AppNotification } from '@/hooks/useNotifications'

interface Props {
  notifications: AppNotification[]
  onClose: () => void
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return 'just now'
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86400)}d ago`
}

export function NotificationsPanel({ notifications, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-full bottom-0 ml-2 w-80 z-50 rounded-xl border border-border bg-white shadow-xl overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Notifications</span>
        <span className="text-xs text-muted-foreground">This session</span>
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No updates yet — changes from teammates will appear here.
        </div>
      ) : (
        <ul className="max-h-96 overflow-y-auto divide-y divide-border">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={n.href}
                onClick={onClose}
                className="flex flex-col gap-0.5 px-4 py-3 hover:bg-muted transition-colors"
              >
                <span className="text-sm text-foreground leading-snug">
                  <span className="font-medium">{n.actorName}</span>
                  {' '}{n.action}{' '}
                  <span className="italic">{n.entityName}</span>
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {n.entityType} · {timeAgo(n.timestamp)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
