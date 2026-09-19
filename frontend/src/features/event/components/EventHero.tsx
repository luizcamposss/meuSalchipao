import { dayMonth, relativeDay } from '@/lib/format'

import type { Phase } from '../hooks'

function badgeText(phase: Phase): string {
  const { mode, snapshot, now } = phase
  switch (mode) {
    case 'before': {
      const rel = relativeDay(now, snapshot.salesOpenAt)
      return rel
        ? `Vendas abrem ${rel}`
        : `Vendas abrem em ${dayMonth(snapshot.salesOpenAt)}`
    }
    case 'selling':
      return 'Vendas abertas'
    case 'redeeming':
      return 'Retirada liberada'
    case 'closed':
      return 'Vendas encerradas'
  }
}

export function EventHero({ phase }: { phase: Phase }) {
  const { snapshot } = phase

  return (
    <section className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-white/10"
      />

      <span className="relative inline-block rounded-full bg-flag-yellow px-3 py-1 text-xs font-bold text-foreground">
        {badgeText(phase)}
      </span>

      <h2 className="relative mt-3 text-2xl font-extrabold leading-tight">
        Semana do Salchipão
      </h2>
      <p className="relative mt-1 text-sm text-primary-foreground/85">
        Garanta o seu kit durante o período de vendas.
      </p>

      <div className="relative mt-4 flex items-center justify-between rounded-xl bg-black/15 px-4 py-3">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-primary-foreground/70">
            Compre de
          </p>
          <p className="text-lg font-extrabold">{dayMonth(snapshot.salesOpenAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-primary-foreground/70">
            Até
          </p>
          <p className="text-lg font-extrabold">{dayMonth(snapshot.salesCloseAt)}</p>
        </div>
      </div>
    </section>
  )
}
