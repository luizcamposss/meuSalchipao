import * as React from 'react'

import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DailySales } from '@/types/api'

/** "2026-09-08" -> "08/09" sem passar por Date (evita deslocamento de fuso). */
function dayLabel(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

/** Topo do eixo Y: um número "redondo" logo acima do pico. */
function niceCeil(value: number): number {
  if (value <= 5) return Math.max(1, Math.ceil(value))
  if (value <= 10) return Math.ceil(value / 2) * 2
  const pow = 10 ** Math.floor(Math.log10(value))
  const n = value / pow
  const step = n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 3 ? 3 : n <= 5 ? 5 : 10
  return Math.round(step * pow)
}

// ---- gráfico: salchipões por dia --------------------------------------

export function SalesBarChart({ data }: { data: DailySales[] }) {
  const [hover, setHover] = React.useState<number | null>(null)

  const rows = (data ?? []).slice(-14)

  if (rows.length === 0) {
    return (
      <div className="grid h-48 place-items-center rounded-xl bg-secondary/30 text-sm text-muted-foreground">
        Nenhuma venda ainda.
      </div>
    )
  }

  const peak = Math.max(...rows.map((r) => r.salchipos))
  const top = niceCeil(peak)
  const maxIdx = rows.findIndex((r) => r.salchipos === peak)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        {/* eixo Y */}
        <div className="flex w-6 shrink-0 flex-col justify-between py-0.5 text-right text-[0.625rem] tabular-nums text-muted-foreground">
          <span>{top}</span>
          <span>0</span>
        </div>

        {/* área do plot */}
        <div className="relative min-w-0 flex-1">
          {/* linhas de grade — recessivas */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-border/45" />
            <div className="border-t border-border/25" />
            <div className="border-t border-border" />
          </div>

          {/* barras */}
          <div className="relative flex h-44 items-end gap-[3px]">
            {rows.map((r, i) => {
              const h = top === 0 ? 0 : (r.salchipos / top) * 100
              const active = hover === i
              return (
                <div
                  key={r.day}
                  tabIndex={0}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover((c) => (c === i ? null : c))}
                  onFocusCapture={() => setHover(i)}
                  onBlur={() => setHover((c) => (c === i ? null : c))}
                  className="group relative flex h-full flex-1 flex-col justify-end outline-none"
                >
                  {/* rótulo direto só no maior dia (ou no que estiver em foco) */}
                  {(i === maxIdx || active) && r.salchipos > 0 ? (
                    <span className="mx-auto mb-1 text-[0.625rem] font-semibold tabular-nums text-foreground">
                      {r.salchipos}
                    </span>
                  ) : null}

                  <div
                    className={cn(
                      'w-full rounded-t-[4px] bg-chart-sales transition-all duration-500 ease-out',
                      active ? 'brightness-110' : 'group-hover:brightness-110',
                    )}
                    style={{ height: `${h}%`, minHeight: r.salchipos > 0 ? 3 : 0 }}
                  />

                  {active ? (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-[0.6875rem] leading-tight text-background shadow-lg">
                      <span className="font-semibold">{dayLabel(r.day)}</span>
                      {' · '}
                      {r.salchipos} salchipã{r.salchipos === 1 ? 'o' : 'es'}
                      <span className="text-background/70"> · {money(r.revenue)}</span>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* eixo X */}
      <div className="flex gap-3">
        <div className="w-6 shrink-0" />
        <div className="flex min-w-0 flex-1 gap-[3px]">
          {rows.map((r, i) => (
            <span
              key={r.day}
              className={cn(
                'flex-1 text-center text-[0.625rem] tabular-nums',
                hover === i
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {dayLabel(r.day)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- medidor: resgate no balcão -------------------------------------

export function RedeemMeter({
  redeemed,
  pending,
}: {
  redeemed: number
  pending: number
}) {
  const total = redeemed + pending

  if (total === 0) {
    return (
      <div className="grid h-full min-h-[8rem] place-items-center rounded-xl bg-secondary/30 text-sm text-muted-foreground">
        Nenhum ticket gerado ainda.
      </div>
    )
  }

  const pct = Math.round((redeemed / total) * 100)
  const redeemedBasis = (redeemed / total) * 100
  const pendingBasis = (pending / total) * 100

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {pct}%
        </span>
        <span className="text-sm text-muted-foreground">
          {redeemed} de {total} tickets retirados
        </span>
      </div>

      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-chart-track">
        {redeemed > 0 ? (
          <div
            className="h-full rounded-full bg-chart-redeemed transition-all duration-500"
            style={{ flexBasis: `${redeemedBasis}%` }}
          />
        ) : null}
        {pending > 0 ? (
          <div
            className="h-full rounded-full bg-chart-pending transition-all duration-500"
            style={{ flexBasis: `${pendingBasis}%` }}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full bg-chart-redeemed" />
          Resgatados
          <b className="tabular-nums text-foreground">{redeemed}</b>
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full bg-chart-pending" />
          A resgatar
          <b className="tabular-nums text-foreground">{pending}</b>
        </span>
      </div>
    </div>
  )
}
