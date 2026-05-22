'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import {
  Users, Briefcase, Activity, TrendingUp, Phone, Mail, Calendar, FileText,
  Building2, ArrowRight, Wallet, Receipt, UserCheck, Trello,
} from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getContacts, getCompanies, getDeals, getActivities, contactDisplayName,
  DEAL_STAGES, type DealStage,
  getInvoices, getExpenses,
  getEmployees, getLeaveRequests,
  getBoards, getCards,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

const ACTIVITY_ICONS = {
  call: Phone, email: Mail, meeting: Calendar, note: FileText,
} as const

export default function DashboardPage() {
  const { doc, roomId } = useRoom()
  // Subscribe to every module's roots so the dashboard reacts to any change
  useYMapDeep(doc.getMap('contacts'))
  useYMapDeep(doc.getMap('companies'))
  useYMapDeep(doc.getMap('deals'))
  useYMapDeep(doc.getMap('activities'))
  useYMapDeep(doc.getMap('invoices'))
  useYMapDeep(doc.getMap('expenses'))
  useYMapDeep(doc.getMap('employees'))
  useYMapDeep(doc.getMap('leaveRequests'))
  useYMapDeep(doc.getMap('kanbanBoards'))
  useYMapDeep(doc.getMap('kanbanCards'))

  const contacts   = getContacts(doc)
  const companies  = getCompanies(doc)
  const deals      = getDeals(doc)
  const activities = getActivities(doc)
  const invoices   = getInvoices(doc)
  const expenses   = getExpenses(doc)
  const employees  = getEmployees(doc)
  const leave      = getLeaveRequests(doc)
  const boards     = getBoards(doc)
  const cards      = getCards(doc)

  const openDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')
  const wonValue  = deals.filter((d) => d.stage === 'won').reduce((s, d) => s + d.value, 0)
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0)

  const stageCounts = DEAL_STAGES.reduce<Record<DealStage, number>>((acc, s) => {
    acc[s] = deals.filter((d) => d.stage === s).length
    return acc
  }, {} as Record<DealStage, number>)

  const recentActivities = activities.slice(0, 6)
  const outstandingInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
  const outstandingValue = outstandingInvoices.reduce((s, i) => s + i.totalCents, 0)
  const monthlyExpenses = (() => {
    const start = new Date(); start.setDate(1); start.setHours(0,0,0,0)
    return expenses
      .filter((e) => e.date >= start.getTime())
      .reduce((s, e) => s + e.amountCents, 0)
  })()
  const activeEmployees = employees.filter((e) => e.status === 'active').length
  const pendingLeave = leave.filter((l) => l.status === 'pending').length

  function fmt(cents: number, ccy = 'USD') {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: ccy, maximumFractionDigits: 0 })
  }

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 p-6 space-y-6 overflow-auto">

        {/* CRM stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users}      label="Contacts"       value={contacts.length} />
          <StatCard icon={Building2}  label="Companies"      value={companies.length} />
          <StatCard icon={Briefcase}  label="Pipeline value" value={fmt(pipelineValue)} change={`${openDeals.length} open deals`} />
          <StatCard icon={TrendingUp} label="Won revenue"    value={fmt(wonValue)}    change={`${deals.filter(d=>d.stage==='won').length} closed`} trend="up" />
        </div>

        {/* Finance + HR + Kanban quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Wallet}    label="Outstanding"      value={fmt(outstandingValue)} change={`${outstandingInvoices.length} invoices`} />
          <StatCard icon={Receipt}   label="Expenses (month)" value={fmt(monthlyExpenses)} />
          <StatCard icon={UserCheck} label="Active team"      value={activeEmployees}      change={pendingLeave > 0 ? `${pendingLeave} leave pending` : undefined} />
          <StatCard icon={Trello}    label="Open cards"       value={cards.length}         change={`${boards.length} board${boards.length !== 1 ? 's' : ''}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Pipeline overview</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/r/${roomId}/crm/deals`}>View all <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2">
                {DEAL_STAGES.map((stage) => (
                  <div key={stage} className="text-center">
                    <div className="text-2xl font-bold">{stageCounts[stage]}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1 capitalize">{stage}</div>
                    <div className="mt-2 h-1 rounded-full bg-[--color-primary]/20 overflow-hidden">
                      <div className="h-full bg-[--color-primary]" style={{ width: deals.length ? `${(stageCounts[stage] / deals.length) * 100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Finance</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/r/${roomId}/finance/invoices`}>View <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium">{invoices.filter((i)=>i.status==='paid').length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span className="font-medium">{invoices.filter((i)=>i.status==='sent').length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Overdue</span><span className="font-medium text-[--color-destructive]">{invoices.filter((i)=>i.status==='overdue').length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Drafts</span><span className="font-medium">{invoices.filter((i)=>i.status==='draft').length}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent activity</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/r/${roomId}/crm/activities`}>View all <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <EmptyState icon={Activity} title="No activity yet" description="Log calls, emails, meetings, or notes to track interactions." />
            ) : (
              <ul className="space-y-3">
                {recentActivities.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type]
                  const contact = contacts.find((c) => c.id === a.contactId)
                  return (
                    <li key={a.id} className="flex items-start gap-3 text-sm">
                      <div className="rounded-full bg-[--color-primary-soft] p-1.5 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-[--color-primary]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{a.subject || `${a.type} logged`}</span>
                          {contact && <span className="text-muted-foreground text-xs">· {contactDisplayName(contact)}</span>}
                        </div>
                        {a.description && <div className="text-xs text-muted-foreground line-clamp-1">{a.description}</div>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(a.date).toLocaleDateString()}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
