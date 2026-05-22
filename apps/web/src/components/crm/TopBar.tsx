'use client'
import { useRoom, type ConnectionState } from '@/contexts/RoomContext'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function StatusDot({ state }: { state: ConnectionState }) {
  const map = {
    'local-only': { c: 'bg-gray-400',                  l: 'Local only' },
    connecting:   { c: 'bg-yellow-400 animate-pulse',  l: 'Connecting…' },
    connected:    { c: 'bg-green-500',                 l: '' },
    offline:      { c: 'bg-red-500',                   l: 'Offline' },
  }[state]
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn('h-2 w-2 rounded-full', map.c)} />
      {map.l || null}
    </span>
  )
}

export function TopBar({ title }: { title: string }) {
  const { connectionState, peers, identity } = useRoom()
  const all = [
    { userId: identity.userId, displayName: identity.displayName, isSelf: true },
    ...peers.map((p) => ({ ...p, isSelf: false })),
  ]
  const syncLabel =
    connectionState === 'connected' && peers.length > 0
      ? `${peers.length + 1} online`
      : connectionState === 'connected'
      ? 'Online'
      : connectionState === 'offline'
      ? 'Offline'
      : null

  return (
    <header className="flex items-center gap-4 border-b border-[--color-border] px-6 py-3 bg-background sticky top-0 z-10">
      <h1 className="text-lg font-semibold flex-1">{title}</h1>
      {connectionState !== 'local-only' && (
        <div className="flex -space-x-1.5">
          {all.slice(0, 5).map((p) => (
            <Avatar key={p.userId} name={p.displayName} size="sm" className="border-2 border-background" />
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <StatusDot state={connectionState} />
        {syncLabel && <span className="text-xs text-muted-foreground">{syncLabel}</span>}
      </div>
    </header>
  )
}
