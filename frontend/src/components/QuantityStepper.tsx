import { MinusIcon, PlusIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type Props = {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
}: Props) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-secondary p-1">
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Diminuir"
        className={cn(
          'grid size-8 place-items-center rounded-full text-secondary-foreground transition-colors',
          'hover:bg-black/5 disabled:pointer-events-none disabled:opacity-40',
        )}
      >
        <MinusIcon className="size-4" />
      </button>

      <span className="w-5 text-center text-base font-bold tabular-nums text-foreground">
        {value}
      </span>

      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Aumentar"
        className={cn(
          'grid size-8 place-items-center rounded-full bg-primary text-primary-foreground transition-transform',
          'active:scale-95 disabled:pointer-events-none disabled:opacity-40',
        )}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  )
}
