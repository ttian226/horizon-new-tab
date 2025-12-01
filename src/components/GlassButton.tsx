import { ReactNode } from 'react'

interface GlassButtonProps {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export default function GlassButton({
  children,
  active = false,
  onClick,
  className = '',
  disabled = false,
}: GlassButtonProps) {
  const baseStyles = `
    group relative overflow-hidden transition-all duration-300 ease-out
    backdrop-blur-md border rounded-full font-medium tracking-wide
    flex items-center justify-center whitespace-nowrap
    px-5 py-2 text-sm
  `

  const activeStyles = active
    ? 'bg-white/20 border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
    : 'bg-black/20 hover:bg-white/10 border-white/10 text-white/80 hover:text-white hover:border-white/30'

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${activeStyles} ${disabledStyles} ${className}`}
    >
      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent z-0" />
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  )
}
