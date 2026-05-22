'use client'
import { useState } from 'react'

export type ViewMode = 'table' | 'grid'

export function useViewMode(
  key: string,
  defaultMode: ViewMode = 'table',
): [ViewMode, (v: ViewMode) => void] {
  const storageKey = `view-mode:${key}`
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return defaultMode
    return (localStorage.getItem(storageKey) as ViewMode) ?? defaultMode
  })

  function setAndPersist(m: ViewMode) {
    setMode(m)
    localStorage.setItem(storageKey, m)
  }

  return [mode, setAndPersist]
}
