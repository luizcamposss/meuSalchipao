import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/format'
import type { SaleWindowResponse } from '@/types/api'

/** Card-destaque da venda avulsa (janela extra aberta fora da fase normal). */
export function SaleWindowCard({ window: w }: { window: SaleWindowResponse }) {
  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-flag-yellow/40">
      <span className="inline-block rounded-full bg-flag-yellow px-3 py-1 text-xs font-bold text-foreground">
        Venda especial de hoje
      </span>

      <p className="mt-3 text-lg font-extrabold text-foreground">{w.label}</p>
      <p className="text-sm text-muted-foreground">
        Das {formatTime(w.opensAt)} às {formatTime(w.closesAt)}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-3">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Unidades restantes
          </p>
          <p className="text-lg font-extrabold text-primary">
            {w.remaining} de {w.cap}
          </p>
        </div>
        <Button
          asChild
          className="h-10 shrink-0 rounded-xl px-4 text-sm font-bold"
        >
          <Link to="/carrinho">Comprar agora</Link>
        </Button>
      </div>
    </section>
  )
}
