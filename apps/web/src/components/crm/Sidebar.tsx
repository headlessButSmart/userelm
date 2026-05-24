'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Settings, Bell, ChevronDown, X,
  Users, Building2, Briefcase, Activity, UserCheck, CalendarDays,
  FileText, Receipt, Wallet, Trello, LifeBuoy,
  type LucideIcon,
} from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useMobileSidebar } from '@/contexts/MobileSidebar'
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

function NavItem({
  href,
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  href: string
  active: boolean
  onClick?: () => void
  icon: React.ReactNode
  label: string
  badge?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150',
        active
          ? 'grad-primary text-white font-medium shadow-lg shadow-[--color-primary]/30'
          : 'text-white/55 hover:text-white hover:bg-white/[0.07]',
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {badge}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { roomId, workspaceName, doc, identity } = useRoom()
  const { open: mobileOpen, close: closeMobile } = useMobileSidebar()
  const base = `/r/${roomId}`

  const counts = useNavCounts(doc)
  const notifications = useNotifications(doc, roomId, identity.userId)
  const [showNotifications, setShowNotifications] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  function toggleSection(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const initial = (identity.displayName.trim()[0] ?? '?').toUpperCase()

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-dvh md:sticky md:top-0 md:h-screen',
          'z-30 w-64 shrink-0 flex flex-col',
          'transition-transform duration-300 ease-out md:transition-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        style={{
          background: 'linear-gradient(170deg, oklch(18% 0.03 286) 0%, oklch(13% 0.02 286) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <Link href="/" onClick={closeMobile} className="flex items-center gap-2.5 group min-w-0">
            <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl">
              <ElmLogo size={30} id="sidebar" />
              <span className="absolute inset-0 rounded-xl grad-primary opacity-15 blur-lg group-hover:opacity-30 transition-opacity" />
            </span>
            <div className="min-w-0">
              <div className="font-bold text-white text-sm leading-tight">Userelm</div>
              <div className="text-[10px] text-white/35 truncate leading-tight">{workspaceName}</div>
            </div>
          </Link>
          <button
            onClick={closeMobile}
            className="md:hidden shrink-0 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
          {/* Dashboard */}
          <NavItem
            href={base}
            active={isActive(base, true)}
            onClick={closeMobile}
            icon={<LayoutDashboard className="h-4 w-4 shrink-0" />}
            label="Dashboard"
          />

          {/* Module sections */}
          {MODULES.filter((m) => m.nav.length > 0).map((m) => {
            const moduleBase = `${base}/${m.id}`
            const isCollapsed = collapsed.has(m.id)
            return (
              <div key={m.id} className="pt-2">
                <button
                  onClick={() => toggleSection(m.id)}
                  className="w-full flex items-center gap-2 px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-white/35 hover:text-white/55 transition-colors rounded-lg hover:bg-white/[0.04]"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: m.accent }}
                  />
                  <span className="flex-1 text-left">{m.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform duration-200',
                      isCollapsed && '-rotate-90',
                    )}
                  />
                </button>

                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5">
                    {m.nav.map((entry) => {
                      const href = `${base}${entry.href}`
                      const active = isActive(href) && isActive(moduleBase)
                      const count = counts[entry.href]
                      return (
                        <NavItem
                          key={entry.href}
                          href={href}
                          active={active}
                          onClick={closeMobile}
                          icon={<Icon name={entry.iconName} className="h-4 w-4 shrink-0" />}
                          label={entry.label}
                          badge={
                            count != null && count > 0 ? (
                              <span
                                className={cn(
                                  'text-[10px] tabular-nums px-1.5 py-px rounded-full font-medium shrink-0',
                                  active
                                    ? 'bg-white/25 text-white'
                                    : 'bg-white/[0.08] text-white/40',
                                )}
                              >
                                {count}
                              </span>
                            ) : undefined
                          }
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pt-2 pb-4 border-t border-white/[0.06] space-y-0.5">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150',
                showNotifications
                  ? 'grad-primary text-white font-medium shadow-lg shadow-[--color-primary]/30'
                  : 'text-white/55 hover:text-white hover:bg-white/[0.07]',
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

          {/* Settings */}
          <NavItem
            href={`${base}/settings`}
            active={isActive(`${base}/settings`)}
            onClick={closeMobile}
            icon={<Settings className="h-4 w-4 shrink-0" />}
            label="Settings"
          />

          {/* Identity strip */}
          <div className="mt-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.05] flex items-center gap-2.5">
            <span className="h-7 w-7 shrink-0 rounded-lg grad-primary inline-flex items-center justify-center text-xs font-bold text-white">
              {initial}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white/80 truncate">{identity.displayName}</div>
              <div className="text-[10px] text-white/30">anonymous</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
