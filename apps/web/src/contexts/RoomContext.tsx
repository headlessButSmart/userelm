'use client'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { initializeDoc } from '@p2p-crm/platform'
import { getOrCreateIdentity } from '@/lib/identity'
import { upsertRoomMember } from '@/lib/roomMembers'
import { saveSnapshot } from '@/lib/yjs/snapshots'
import { connectToRoom } from '@/lib/yjs/provider'

export type ConnectionState = 'local-only' | 'connecting' | 'connected' | 'offline'

export interface Peer {
  userId: string
  displayName: string
  color: string
  email?: string
}

interface RoomCtx {
  doc: Y.Doc
  roomId: string
  identity: { userId: string; displayName: string; email?: string }
  workspaceName: string
  connectionState: ConnectionState
  peers: Peer[]
}

const Ctx = createContext<RoomCtx | null>(null)

export function useRoom() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRoom must be used inside RoomProvider')
  return ctx
}

export function RoomProvider({
  roomId,
  workspaceName,
  children,
}: {
  roomId: string
  workspaceName: string
  children: ReactNode
}) {
  const [ready, setReady] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('local-only')
  const [peers, setPeers] = useState<Peer[]>([])
  const docRef = useRef<Y.Doc | null>(null)
  const identityRef = useRef<{ userId: string; displayName: string } | null>(null)

  useEffect(() => {
    // getOrCreateIdentity reads localStorage — must be client-only (inside useEffect)
    const identity = getOrCreateIdentity()
    identityRef.current = identity
    let destroyed = false
    let snapshotTimer: ReturnType<typeof setInterval>
    let destroyConn: (() => void) | undefined

    const token = sessionStorage.getItem(`room-token:${roomId}`)
    const iceRaw = sessionStorage.getItem(`room-ice:${roomId}`)
    const signalingUrl =
      process.env['NEXT_PUBLIC_SIGNALING_URL'] ?? 'ws://localhost:4444'

    // Extract the shared room key from the stored join URL — this is the WebRTC encryption password.
    // All members know it (they used it to join), so it's safe to use as a shared symmetric key.
    const joinUrl = localStorage.getItem(`room-joinurl:${roomId}`) ?? ''
    const joinFragment = new URLSearchParams(joinUrl.split('#')[1] ?? '')
    const password = joinFragment.get('key') ?? roomId

    if (token && iceRaw) {
      // Networked mode — connectToRoom handles IndexedDB + WebRTC
      setConnectionState('connecting')
      const iceServers = JSON.parse(iceRaw) as RTCIceServer[]

      connectToRoom({ roomId, token, password, signalingUrl, iceServers, identity })
        .then((conn) => {
          if (destroyed) { conn.destroy(); return }

          initializeDoc(conn.doc, workspaceName, identity.userId, identity.displayName)
          docRef.current = conn.doc
          setConnectionState('connected')
          setReady(true)

          // Persist self to room members so card assignment works even offline
          if (identity.email) {
            upsertRoomMember(roomId, {
              userId: identity.userId,
              displayName: identity.displayName,
              email: identity.email,
            })
          }

          // Track peers via awareness (connection state is independent of peer count)
          const syncPeers = () => {
            const states = Array.from(conn.awareness.getStates().entries())
            const others: Peer[] = []
            for (const [clientId, state] of states) {
              if (clientId === conn.doc.clientID) continue
              const u = (state as any)?.user
              if (u?.userId) {
                others.push(u as Peer)
                // Persist peer email to localStorage for offline use
                if (u.email) {
                  upsertRoomMember(roomId, {
                    userId: u.userId,
                    displayName: u.displayName ?? '',
                    email: u.email,
                  })
                }
              }
            }
            setPeers(others)
          }

          conn.awareness.on('change', syncPeers)
          syncPeers()

          snapshotTimer = setInterval(() => saveSnapshot(roomId, conn.doc), 30 * 60 * 1000)
          destroyConn = () => {
            clearInterval(snapshotTimer)
            conn.awareness.off('change', syncPeers)
            conn.destroy()
          }
        })
        .catch(() => {
          if (destroyed) return
          // Signaling unreachable — fall back to local-only
          setConnectionState('offline')
          bootLocalOnly(identity)
        })
    } else {
      // Local-only mode
      bootLocalOnly(identity)
    }

    function bootLocalOnly(identity: { userId: string; displayName: string; email?: string }) {
      const doc = new Y.Doc()
      const persistence = new IndexeddbPersistence(`crm-${roomId}`, doc)
      persistence.whenSynced.then(() => {
        if (destroyed) { persistence.destroy(); doc.destroy(); return }
        initializeDoc(doc, workspaceName, identity.userId, identity.displayName)
        docRef.current = doc
        if (identity.email) {
          upsertRoomMember(roomId, {
            userId: identity.userId,
            displayName: identity.displayName,
            email: identity.email,
          })
        }
        setReady(true)
        snapshotTimer = setInterval(() => saveSnapshot(roomId, doc), 30 * 60 * 1000)
        destroyConn = () => {
          clearInterval(snapshotTimer)
          persistence.destroy()
          doc.destroy()
        }
      })
    }

    return () => {
      destroyed = true
      destroyConn?.()
    }
  }, [roomId, workspaceName])

  if (!ready || !docRef.current || !identityRef.current) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading workspace…
      </div>
    )
  }

  const value: RoomCtx = {
    doc: docRef.current,
    roomId,
    identity: identityRef.current!,
    workspaceName,
    connectionState,
    peers,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
