import { ClockIcon } from 'lucide-react'

import { formatTime } from '@/lib/format'
import type { SaleWindowResponse } from '@/types/api'

/** Selo de canto com a cota da venda avulsa — usado no card do produto. */
export function SaleWindowBadge({ window: w }: { window: SaleWindowResponse }) {
  return (
    <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-primary/10 py-1.5 pl-2.5 pr-3 text-primary">
      <ClockIcon className="size-3.5 shrink-0" />
      <div className="text-right leading-tight">
        <p className="text-[0.6875rem] font-extrabold">
          {w.remaining} unidades
        </p>
        <p className="text-[0.5625rem] font-medium text-primary/70">
          até {formatTime(w.closesAt)}
        </p>
      </div>
    </div>
  )
}
