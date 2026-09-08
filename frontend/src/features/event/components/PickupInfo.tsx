import { TicketIcon } from 'lucide-react'

import { dayOfMonth, longDate, monthShort, weekdayShort } from '@/lib/format'

import type { Phase } from '../hooks'

/** Card branco do dia da retirada. */
export function PickupInfo({ phase }: { phase: Phase }) {
  const at = phase.snapshot.redemptionOpensAt

  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center rounded-xl bg-muted px-3 py-2 text-center leading-none">
          <span className="text-[0.625rem] font-semibold text-muted-foreground">
            {monthShort(at)}
          </span>
          <span className="my-1 text-xl font-extrabold text-foreground">
            {dayOfMonth(at)}
          </span>
          <span className="text-[0.5625rem] font-medium text-muted-foreground">
            {weekdayShort(at)}
          </span>
        </div>

        <div className="flex-1">
          <p className="font-bold text-foreground">Dia da retirada</p>
          <p className="text-lg font-extrabold text-primary">{longDate(at)}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Retirada presencial no balcão.
          </p>
        </div>
      </div>

      <div className="my-4 h-px bg-border" />

      <div className="flex items-start gap-2 text-sm text-flag-green">
        <TicketIcon className="mt-0.5 size-4 shrink-0" />
        <p>Leve o ticket digital e confirme somente no balcão.</p>
      </div>
    </section>
  )
}
