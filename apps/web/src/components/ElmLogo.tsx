export function ElmLogo({
  size = 32,
  id = 'elm',
}: {
  size?: number
  id?: string
}) {
  const g = `ug-${id}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Userelm logo"
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* U letterform */}
      <path
        d="M16 8 L16 62 Q16 92 50 92 Q84 92 84 62 L84 8 L64 8 L64 62 Q64 75 50 75 Q36 75 36 62 L36 8 Z"
        fill={`url(#${g})`}
      />
    </svg>
  )
}
