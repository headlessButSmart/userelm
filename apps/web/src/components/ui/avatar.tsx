import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export function Avatar({ name, size = 'sm', color, className }: AvatarProps) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const bg = color ?? `hsl(${hue}, 65%, 50%)`
  const sizes = {
    xs: 'h-5 w-5 text-[9px]',
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
  }
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full font-bold text-white shrink-0', sizes[size], className)}
      style={{ background: bg }}
    >
      {initials}
    </span>
  )
}
