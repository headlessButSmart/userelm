'use client'
import { LayoutList, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/hooks/useViewMode'

export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (v: ViewMode) => void
}) {
  return (
    <div className="flex items-center rounded-md border border-border bg-muted p-0.5 gap-0.5">
      <button
        onClick={() => onChange('table')}
        className={cn(
          'rounded p-1.5 transition-colors',
          value === 'table'
            ? 'bg-white text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        aria-label="Table view"
      >
        <LayoutList className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onChange('grid')}
        className={cn(
          'rounded p-1.5 transition-colors',
          value === 'grid'
            ? 'bg-white text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
