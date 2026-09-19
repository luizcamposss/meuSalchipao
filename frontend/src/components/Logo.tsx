import logoUrl from '@/assets/logo-stacked.webp'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="Meu Salchipão"
      className={cn('h-auto w-56 select-none', className)}
      draggable={false}
    />
  )
}
