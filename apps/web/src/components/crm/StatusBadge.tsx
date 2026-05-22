import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LeadStatus } from '@p2p-crm/platform'

const STATUS_STYLES: Record<LeadStatus, string> = {
  new:        'bg-blue-100 text-blue-700 border-blue-200',
  contacted:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  qualified:  'bg-purple-100 text-purple-700 border-purple-200',
  customer:   'bg-green-100 text-green-700 border-green-200',
  lost:       'bg-gray-100 text-gray-600 border-gray-200',
}

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[status], className)}>
      {status}
    </span>
  )
}
