import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Junta classes condicionais (clsx) e resolve conflitos do Tailwind (twMerge).
 * Ex.: cn('px-2', isBig && 'px-4') -> 'px-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
