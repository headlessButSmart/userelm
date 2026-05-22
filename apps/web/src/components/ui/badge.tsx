import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' && 'border-transparent bg-[--color-primary] text-[--color-primary-foreground]',
        variant === 'secondary' && 'border-transparent bg-[--color-muted] text-[--color-muted-foreground]',
        variant === 'outline' && 'text-foreground',
        className,
      )}
      {...props}
    />
  )
}
