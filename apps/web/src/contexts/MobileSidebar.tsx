'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'

interface MobileSidebarCtx {
  open: boolean
  toggle: () => void
  close: () => void
}

const Ctx = createContext<MobileSidebarCtx>({ open: false, toggle: () => {}, close: () => {} })

export const useMobileSidebar = () => useContext(Ctx)

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Ctx.Provider value={{ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }}>
      {children}
    </Ctx.Provider>
  )
}
