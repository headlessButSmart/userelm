'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Settings, Bell,
  Users, Building2, Briefcase, Activity, UserCheck, CalendarDays, FileText, Receipt, Wallet, Trello, LifeBuoy,
  type LucideIcon,
} from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { MODULES } from '@p2p-crm/platform'
import { ElmLogo } from '@/components/ElmLogo'
import { cn } from '@/lib/utils'
import { useNavCounts } from '@/hooks/useNavCounts'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationsPanel } from './NotificationsPanel'

const ICONS: Record<string, LucideIcon> = {
  Users, Building2, Briefcase, Activity, UserCheck, CalendarDays,
  FileText, Receipt, Wallet, Trello, LifeBuoy, LayoutDashboard, Settings,
}

function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name]
  return C ? <C className={className} /> : null
}

export function Sidebar() {
  const pathname = usePathname()
  const { roomId, workspaceName, doc, identity } = useRoom()
  const base = `/r/${roomId}`

  const counts = useNavCounts(doc)
  const notifications = useNotifications(doc, roomId, identity.userId)
  const [showNotifications, setShowNotifications] = useState(false)

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  const linkClass = (active: boolean) => cn(
    'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all relative',
    active
      ? 'bg-white/10 text-white font-medium shadow-[inset_0_0_0_1px_color-mix(in_oklch,white_15%,transparent)]'
      : 'text-white/65 hover:text-white hover:bg-white/10',
  )

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-screen sticky top-0 text-white/90"
      style={{
        background: 'linear-gradient(180deg, var(--color-sidebar) 0%, color-mix(in oklch, var(--color-sidebar) 85%, black) 100%)',
        borderRight: '1px solid var(--color-sidebar-border)',
      }}
    >
      <div className="px-4 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg shadow-lg shadow-[--color-primary]/30">
            <ElmLogo size={32} id="sidebar" />
            <span className="absolute -inset-0.5 rounded-lg grad-primary opacity-20 blur-md -z-10 group-hover:opacity-40 transition-opacity" />
          </span>
          <span className="font-bold text-sm tracking-tight">Userelm</span>
        </Link>
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-wider text-white/55 font-semibold mb-0.5">Workspace</div>
          <div className="text-sm font-medium truncate text-white">{workspaceName}</div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 flex flex-col gap-4 overflow-y-auto">
        <div>
          <Link href={base} className={linkClass(isActive(base, true))}>
            {isActive(base, true) && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-[--color-accent]" />}
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {MODULES.filter((m) => m.nav.length > 0).map((m) => {
          const moduleBase = `${base}/${m.id}`
          return (
            <div key={m.id}>
              <div className="flex items-center gap-2 px-3 mb-1.5">
                <Icon name={m.iconName} className="h-3.5 w-3.5 text-white/70" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  {m.title}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {m.nav.map((entry) => {
                  const href = `${base}${entry.href}`
                  const active = isActive(href) && isActive(moduleBase)
                  const count = counts[entry.href]
                  return (
                    <Link key={entry.href} href={href} className={linkClass(active)}>
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-[--color-accent]" />}
                      <Icon name={entry.iconName} className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{entry.label}</span>
                      {count != null && count > 0 && (
                        <span className="text-[10px] tabular-nums text-white/45 ml-auto">
                          {count}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="px-2 py-3 border-t border-white/10 flex flex-col gap-0.5">
        {/* Notifications bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all',
              showNotifications
                ? 'bg-white/10 text-white'
                : 'text-white/65 hover:text-white hover:bg-white/10',
            )}
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Notifications</span>
            {notifications.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[--color-accent] text-[10px] font-semibold text-white tabular-nums">
                {notifications.length > 99 ? '99+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationsPanel
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        <Link href={`${base}/settings`} className={linkClass(isActive(`${base}/settings`))}>
          {isActive(`${base}/settings`) && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-[--color-accent]" />}
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
