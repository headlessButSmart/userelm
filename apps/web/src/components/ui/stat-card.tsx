import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  icon: LucideIcon
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'flat'
  className?: string
}

export function StatCard({ icon: Icon, label, value, change, trend = 'flat', className }: Props) {
  return (
    <div className={cn('rounded-xl border border-[--color-border] bg-card p-5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      {change && (
        <div className={cn(
          'mt-1 text-xs',
          trend === 'up' && 'text-[--color-success]',
          trend === 'down' && 'text-[--color-destructive]',
          trend === 'flat' && 'text-muted-foreground',
        )}>
          {change}
        </div>
      )}
    </div>
  )
}
