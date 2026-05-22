'use client'
import { useRef, useSyncExternalStore } from 'react'
import * as Y from 'yjs'

export function useYMap<T>(map: Y.Map<T>): T[] {
  const cache = useRef<T[]>(Array.from(map.values()))

  return useSyncExternalStore(
    (cb) => {
      const handler = () => {
        cache.current = Array.from(map.values())
        cb()
      }
      map.observe(handler)
      return () => map.unobserve(handler)
    },
    () => cache.current,
    () => [],
  )
}

export function useYMapDeep<T>(map: Y.Map<T>): T[] {
  const cache = useRef<T[]>(Array.from(map.values()))

  return useSyncExternalStore(
    (cb) => {
      const handler = () => {
        cache.current = Array.from(map.values())
        cb()
      }
      map.observeDeep(handler)
      return () => map.unobserveDeep(handler)
    },
    () => cache.current,
    () => [],
  )
}

export function useAwareness(awareness: {
  on: (e: string, cb: () => void) => void
  off: (e: string, cb: () => void) => void
  getStates: () => Map<number, unknown>
}) {
  const cache = useRef<unknown[]>(Array.from(awareness.getStates().values()))

  return useSyncExternalStore(
    (cb) => {
      const handler = () => {
        cache.current = Array.from(awareness.getStates().values())
        cb()
      }
      awareness.on('change', handler)
      return () => awareness.off('change', handler)
    },
    () => cache.current,
    () => [],
  )
}
