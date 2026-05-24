import Link from 'next/link'
import {
  ArrowRight, Database, Lock, Heart, Wifi, FileDown, Users, Check, Github,
  Briefcase, Wallet, UserCheck, Trello, LifeBuoy,
  MessageCircle, Sparkles,
} from 'lucide-react'
import { ElmLogo } from '@/components/ElmLogo'

const MODULE_CARDS = [
  {
    id: 'crm',
    icon: Briefcase,
    title: 'CRM',
    tagline: 'Sales & customer relationships',
    accent: 'oklch(60% 0.18 250)',
    bullets: ['Contacts & companies', 'Deal pipeline', 'Activity timeline'],
    isNew: false,
  },
  {
    id: 'finance',
    icon: Wallet,
    title: 'Finance',
    tagline: 'Invoicing & expenses',
    accent: 'oklch(64% 0.16 145)',
    bullets: ['Recurring invoices', 'Expense tracking', 'Revenue dashboards'],
    isNew: false,
  },
  {
    id: 'hr',
    icon: UserCheck,
    title: 'HR',
    tagline: 'Team & operations',
    accent: 'oklch(60% 0.16 30)',
    bullets: ['Employee directory', 'Leave requests', 'Roles & departments'],
    isNew: false,
  },
  {
    id: 'kanban',
    icon: Trello,
    title: 'Boards',
    tagline: 'Project management',
    accent: 'oklch(62% 0.16 220)',
    bullets: ['Kanban boards', 'Drag-and-drop cards', 'Priority & due dates'],
    isNew: false,
  },
  {
    id: 'tickets',
    icon: LifeBuoy,
    title: 'Support',
    tagline: 'Customer support ticketing',
    accent: 'oklch(65% 0.15 185)',
    bullets: ['Ticket tracking & status', 'Assignee routing', 'Internal notes'],
    isNew: true,
  },
] as const

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* What's new banner */}
      <div className="grad-primary text-white text-xs">
        <div className="container mx-auto max-w-6xl px-6 py-1.5 flex items-center justify-center gap-2">
          <LifeBuoy className="h-3.5 w-3.5" />
          <span className="font-semibold">New:</span>
          <span className="opacity-90">Customer support ticketing is now built in — free</span>
          <Sparkles className="h-3.5 w-3.5 opacity-80" />
        </div>
      </div>

      {/* Nav */}
      <header className="border-b border-[--color-border] sticky top-0 bg-background/70 backdrop-blur-xl z-10">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <ElmLogo size={28} id="nav" />
            Userelm
          </Link>
          <nav className="hidden md:flex gap-6 text-sm text-muted-foreground">
            <a href="#modules"  className="hover:text-foreground transition-colors">Modules</a>
            <a href="#features" className="hover:text-foreground transition-colors">Why P2P</a>
            <a href="#how"      className="hover:text-foreground transition-colors">How it works</a>
            <a href="#trust"    className="hover:text-foreground transition-colors">Trust</a>
            <a href="#faq"      className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-[--color-primary] px-4 py-2 text-sm font-medium text-[--color-primary-foreground] hover:opacity-90"
          >
            Get started free <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[--color-primary-soft] px-3 py-1 text-xs font-medium text-[--color-primary] mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-[--color-primary] animate-pulse" />
          100% free forever · open source · no signup
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.05]">
          The team workspace where{' '}
          <span className="text-grad">your data stays yours.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-3">
          Userelm is a <strong className="text-foreground font-semibold">free, peer-to-peer</strong> team workspace with CRM, Finance, HR, Boards, Support ticketing, and Chat built in.
          Your data lives only in your browser and syncs directly with teammates over WebRTC.
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-10">
          We never see it — because we can&apos;t. No tiers, no upsells, no credit card.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/new"
            className="grad-primary inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white hover:opacity-95 shadow-xl shadow-[--color-primary]/30"
          >
            Create your workspace — it&apos;s free <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#modules"
            className="inline-flex items-center gap-2 rounded-lg border border-[--color-border] px-6 py-3 text-sm font-medium hover:bg-[--color-muted] transition-colors"
          >
            Explore modules
          </a>
        </div>

        {/* Hero visual */}
        <div className="mt-16 relative">
          <div className="rounded-xl border border-[--color-border] shadow-2xl shadow-[--color-primary]/10 bg-card overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-[--color-border] px-4 py-2.5 bg-[--color-muted]">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">userelm.com/r/acme</span>
            </div>
            <div className="grid grid-cols-12 min-h-80">
              <aside className="col-span-3 border-r border-slate-800 py-3 bg-slate-900 text-white text-left overflow-hidden">
                <div className="px-3 py-1 mb-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">CRM</div>
                {[
                  { label: 'Contacts', active: true },
                  { label: 'Companies' },
                  { label: 'Deals' },
                ].map((x) => (
                  <div
                    key={x.label}
                    className={`mx-2 px-2 py-1 rounded text-xs ${x.active ? 'grad-primary text-white font-medium shadow' : 'text-slate-400'}`}
                  >
                    {x.label}
                  </div>
                ))}
                <div className="px-3 py-1 mt-3 mb-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Finance</div>
                <div className="mx-2 px-2 py-1 rounded text-xs text-slate-400">Invoices</div>
                <div className="px-3 py-1 mt-3 mb-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Boards</div>
                <div className="mx-2 px-2 py-1 rounded text-xs text-slate-400">Boards</div>
                <div className="px-3 py-1 mt-3 mb-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Support</div>
                <div className="mx-2 px-2 py-1 rounded text-xs text-slate-400">Tickets</div>
              </aside>
              <main className="col-span-9 p-6 text-left">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold">Contacts</div>
                  <div className="flex -space-x-2">
                    {['#a855f7', '#06b6d4', '#f59e0b'].map((c, i) => (
                      <span key={i} className="inline-block h-6 w-6 rounded-full border-2 border-card" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Sarah Chen',   co: 'Linear',    status: 'Customer'  },
                    { name: 'Marc Dubois',  co: 'Stripe',    status: 'Qualified' },
                    { name: 'Aisha Khan',   co: 'Notion',    status: 'New'       },
                    { name: 'Jamal Wright', co: 'Vercel',    status: 'Contacted' },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center gap-3 p-2 rounded hover:bg-[--color-muted]/50">
                      <span className="h-7 w-7 rounded-full bg-[--color-primary]/20 inline-flex items-center justify-center text-[10px] font-bold text-[--color-primary]">
                        {r.name.split(' ').map(w=>w[0]).join('')}
                      </span>
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.co}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[--color-primary-soft] text-[--color-primary] font-medium">
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </main>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="container mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-3">One workspace, six modules</h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Userelm is built around a generic platform core. Modules are pluggable — and the same
          P2P sync, encryption, and export story applies to every byte across all of them.
          All free, forever.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {MODULE_CARDS.map((m) => (
            <div
              key={m.id}
              className="relative overflow-hidden rounded-xl border border-[--color-border] p-6 pt-7 bg-card hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <span
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, ${m.accent}, ${m.accent}66)` }}
              />
              {m.isNew && (
                <span
                  className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: m.accent }}
                >
                  New
                </span>
              )}
              <div className="inline-flex p-2.5 rounded-lg mb-4" style={{ background: `${m.accent}22`, color: m.accent }}>
                <m.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{m.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{m.tagline}</p>
              <ul className="space-y-1.5 text-sm">
                {m.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-[--color-success] shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Chat callout — separate since it's a floating overlay, not a nav module */}
        <div className="mt-5 rounded-xl border border-[--color-border] p-5 bg-card flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="inline-flex p-2.5 rounded-lg shrink-0" style={{ background: 'oklch(60% 0.18 286 / 0.15)', color: 'oklch(60% 0.18 286)' }}>
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-0.5">+ Team chat</h3>
            <p className="text-sm text-muted-foreground">Real-time P2P chat built into every workspace — same encryption link, zero extra setup. Available as a floating panel in any module.</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-[--color-border] p-5 text-center bg-[--color-muted]/40">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">More coming.</strong> The platform is module-driven —
            new domains (inventory, ops, scheduling) slot in without touching the sync engine.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[--color-muted]/50 border-y border-[--color-border]">
        <div className="container mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-3">Why peer-to-peer?</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Everything you need to run your team — without locking your data behind someone else&apos;s pricing.
            Free because we don&apos;t need servers to store your data.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Database, title: 'Zero server storage', desc: 'All module data lives in your browser. We literally cannot see it.' },
              { icon: Wifi,     title: 'Real-time P2P sync',  desc: 'WebRTC keeps teammates synced instantly across every module.' },
              { icon: FileDown, title: 'Export anytime',      desc: 'Binary, JSON, or CSV. Your data is never trapped.' },
              { icon: Users,    title: 'Multi-player ready',  desc: 'See presence and changes from teammates live.' },
              { icon: Lock,     title: 'End-to-end encrypted',desc: 'WebRTC traffic is encrypted with your room key.' },
              { icon: Heart,    title: 'Free forever',        desc: 'No tiers, no upsells, no credit card. Self-host for full sovereignty.' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-[--color-border] p-6 bg-card hover:shadow-md transition-shadow">
                <div className="inline-flex p-2.5 rounded-lg bg-[--color-primary-soft] text-[--color-primary] mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support showcase */}
      <section className="container mx-auto max-w-6xl px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[--color-primary-soft] px-3 py-1 text-xs font-medium text-[--color-primary] mb-4">
              <LifeBuoy className="h-3.5 w-3.5" /> New
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              <span className="text-grad">Customer support ticketing</span>, built right in.
            </h2>
            <p className="text-muted-foreground mb-6">
              Track and resolve customer issues without paying for a separate helpdesk tool.
              Tickets live in the same P2P workspace — assign them to team members, leave internal
              notes, and update status in real time.
            </p>
            <ul className="space-y-2.5 text-sm">
              {[
                'Create tickets from any customer email or request',
                'Assign to team members using their email addresses',
                'Internal notes visible only to your team',
                'Status workflow: Open → In Progress → Resolved → Closed',
                'Threaded comments synced peer-to-peer — no server',
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[--color-success] mt-0.5 shrink-0" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-2xl border border-[--color-border] bg-card shadow-2xl shadow-[--color-primary]/10 overflow-hidden">
              {/* Ticket list header */}
              <div className="px-4 py-3 border-b border-[--color-border] flex items-center justify-between bg-[--color-muted]/40">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <LifeBuoy className="h-4 w-4 text-[--color-primary]" /> Tickets
                </div>
                <div className="flex gap-2">
                  {[
                    { label: '3 Open', style: 'bg-blue-100 text-blue-700' },
                    { label: '1 In Progress', style: 'bg-yellow-100 text-yellow-700' },
                  ].map((b) => (
                    <span key={b.label} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${b.style}`}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[--color-border]">
                {[
                  { n: '#4', title: 'Payment not processed after upgrade', status: 'In Progress', priority: 'urgent', from: 'carlos@acme.io', assignee: 'alice', dotColor: 'bg-red-500', statusStyle: 'bg-yellow-100 text-yellow-700' },
                  { n: '#3', title: 'CSV export missing phone column', status: 'Open', priority: 'high', from: 'priya@corp.com', assignee: null, dotColor: 'bg-orange-500', statusStyle: 'bg-blue-100 text-blue-700' },
                  { n: '#2', title: 'Can\'t invite second team member', status: 'Open', priority: 'medium', from: 'ben@startup.io', assignee: null, dotColor: 'bg-yellow-400', statusStyle: 'bg-blue-100 text-blue-700' },
                ].map((t) => (
                  <div key={t.n} className="px-4 py-3 hover:bg-[--color-muted]/30 cursor-pointer">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground w-6">{t.n}</span>
                      <span className={`h-2 w-2 rounded-full shrink-0 ${t.dotColor}`} />
                      <span className="text-sm font-medium flex-1 truncate">{t.title}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${t.statusStyle}`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 ml-8 text-[10px] text-muted-foreground">
                      <span>{t.from}</span>
                      {t.assignee ? (
                        <span className="flex items-center gap-1">
                          → <span className="grad-primary text-white rounded-full px-1.5 py-px">{t.assignee}</span>
                        </span>
                      ) : (
                        <span className="italic">unassigned</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat showcase */}
      <section className="bg-[--color-muted]/50 border-y border-[--color-border]">
        <div className="container mx-auto max-w-6xl px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[--color-primary-soft] px-3 py-1 text-xs font-medium text-[--color-primary] mb-4">
                <MessageCircle className="h-3.5 w-3.5" /> Also built in
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                <span className="text-grad">Real-time chat</span>, right where you work.
              </h2>
              <p className="text-muted-foreground mb-6">
                No more juggling Slack tabs to discuss the deal you&apos;re looking at. Userelm ships
                with a built-in team chat — same P2P link, same encryption, zero extra setup.
              </p>
              <ul className="space-y-2.5 text-sm">
                {[
                  'Floating chat button in every workspace',
                  'Messages sync over the same WebRTC link',
                  'Stored only in your browsers — never on our servers',
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[--color-success] mt-0.5 shrink-0" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-[--color-border] bg-card shadow-2xl shadow-[--color-primary]/10 overflow-hidden">
                <div className="grad-primary px-4 py-3 flex items-center gap-2 text-white">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm font-semibold">Team chat</span>
                  <span className="ml-auto text-[10px] opacity-80">3 online</span>
                </div>
                <div className="p-4 space-y-3 bg-[--color-muted]/30">
                  {[
                    { who: 'Alice', mine: false, color: 'oklch(60% 0.18 250)', msg: 'Marc Dubois moved to Customer — invoice ready to send?' },
                    { who: 'Bob',   mine: false, color: 'oklch(60% 0.16 30)',  msg: 'Yep, drafting INV-2104 now. Net 30 ok with you?' },
                    { who: 'you',   mine: true,  color: 'oklch(64% 0.16 145)', msg: 'Net 30 works. Nice job team!' },
                  ].map((m, i) => (
                    <div key={i} className={`flex items-end gap-2 ${m.mine ? 'flex-row-reverse' : ''}`}>
                      <span
                        className="h-7 w-7 shrink-0 rounded-full inline-flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: m.color }}
                      >
                        {m.who[0]?.toUpperCase() ?? '?'}
                      </span>
                      <div className={`max-w-[75%] ${m.mine ? 'text-right' : ''}`}>
                        <div className="text-[10px] text-muted-foreground mb-0.5">{m.who}</div>
                        <div
                          className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                            m.mine
                              ? 'grad-primary text-white rounded-br-sm'
                              : 'bg-card border border-[--color-border] rounded-bl-sm'
                          }`}
                        >
                          {m.msg}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[--color-border] p-3 flex items-center gap-2 bg-card">
                  <div className="flex-1 rounded-full border border-[--color-border] bg-[--color-muted]/40 px-3 py-1.5 text-xs text-muted-foreground">
                    Message your team…
                  </div>
                  <button className="grad-primary text-white rounded-full p-1.5">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-3">How it works</h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Three steps. No accounts. No credit card. No emails to confirm.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { n: '1', title: 'Create a workspace', desc: 'Pick a name. We hand you a join URL with a secret key — that\'s your entire free team workspace.' },
            { n: '2', title: 'Share the URL', desc: 'Send it to your teammates over Signal, email, or carrier pigeon.' },
            { n: '3', title: 'Open any module', desc: 'CRM, Finance, HR, Boards, Support, Chat — all in the same browser-local doc, syncing peer-to-peer.' },
          ].map((s) => (
            <div key={s.n}>
              <div className="text-5xl font-bold text-[--color-primary]/30 mb-3">{s.n}</div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="bg-[--color-muted]/50 border-y border-[--color-border]">
        <div className="container mx-auto max-w-6xl px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">What we store: nothing.</h2>
              <p className="text-muted-foreground mb-6">
                Our server only knows that a room exists. We store room IDs and hashed secrets so the
                join flow works — that&apos;s it. Whether you put contacts, invoices, employee
                records, or support tickets into your workspace, none of it touches us.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  'No CRM / Finance / HR / Boards / Support data on our servers',
                  'No analytics or marketing cookies',
                  'No tracking pixels',
                  'Open source — verify it yourself',
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[--color-success] mt-0.5 shrink-0" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[--color-border] p-6 bg-card font-mono text-xs">
              <div className="text-muted-foreground mb-2">// What our database knows</div>
              <pre className="text-foreground">{`{
  "rooms": [
    {
      "id": "CpTjv2MWDLJ9",
      "hashedSecret": "$2a$10$...",
      "ownerEmail": "you@team.com",
      "createdAt": "2025-05-20"
    }
  ]
}`}</pre>
              <div className="text-muted-foreground mt-3">// That&apos;s the whole story.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Is it really free?',
              a: 'Yes, free forever. Because we don\'t store your data, our costs are tiny — just a signaling server for WebRTC handshakes. We may add paid features later (custom domains, audit logs) but the core workspace — CRM, Finance, HR, Boards, Support, and Chat — stays free.',
            },
            {
              q: 'There\'s support ticketing now?',
              a: 'Yes! The Support module lets you create, assign, and track customer support tickets. You can set status (Open / In Progress / Resolved / Closed), route tickets to team members by email, leave internal notes, and have threaded comment threads — all synced P2P like everything else.',
            },
            {
              q: 'Does P2P sync really work for all modules?',
              a: 'Yes. The platform core handles sync; modules just declare their data shape. Whether you\'re editing a contact, an invoice, moving a kanban card, or updating a support ticket, the same CRDT (Yjs) syncs it over WebRTC.',
            },
            {
              q: 'What happens if I clear my browser data?',
              a: 'On that device, you lose access until you rejoin while a teammate is online (they\'ll sync the data back to you). We strongly recommend regular exports — there\'s a one-click backup feature that captures every module.',
            },
            {
              q: 'Can I use just one module?',
              a: 'Yes — use whichever modules you need. They\'re all opt-in at usage level; data only exists for what you create.',
            },
            {
              q: 'Will you keep adding modules?',
              a: 'That\'s the plan. The platform is intentionally module-driven so new domains (inventory, scheduling, ops) can ship without touching the sync engine. Suggestions welcome.',
            },
            {
              q: 'Can I self-host?',
              a: 'Yes. The whole stack is open source. Run the Next.js app, the signaling server, and a coturn instance, and you\'re fully sovereign.',
            },
          ].map((item) => (
            <details key={item.q} className="rounded-lg border border-[--color-border] p-5 bg-card group">
              <summary className="cursor-pointer font-medium list-none flex items-center justify-between">
                {item.q}
                <span className="text-[--color-primary] group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="grad-primary">
        <div className="container mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">Ready to own your team workspace?</h2>
          <p className="text-white/80 mb-8 text-lg">Free forever. Ten seconds to start. No credit card.</p>
          <Link
            href="/new"
            className="inline-flex items-center gap-2 rounded-md bg-white text-[--color-primary] px-8 py-4 text-base font-semibold hover:opacity-90 shadow-lg"
          >
            Create your free workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[--color-border] mt-auto">
        <div className="container mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row gap-4 items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ElmLogo size={20} id="footer" />
            <span className="font-semibold text-foreground">Userelm</span>
            <span>· free forever · open source</span>
          </div>
          <div className="flex gap-6">
            <a href="#modules" className="hover:text-foreground">Modules</a>
            <a href="#trust"   className="hover:text-foreground">Trust</a>
            <a href="https://github.com/headlessButSmart/userelm" target="_blank" rel="noreferrer" className="hover:text-foreground inline-flex items-center gap-1">
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
