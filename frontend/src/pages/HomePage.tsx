import { RotateCwIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/features/auth/hooks'
import { EventHero } from '@/features/event/components/EventHero'
import { PickupInfo } from '@/features/event/components/PickupInfo'
import { type Phase, usePhase } from '@/features/event/hooks'
import { dayMonth, relativeDay } from '@/lib/format'

const CTA_CLASS =
  'h-12 w-full rounded-xl text-[15px] font-semibold shadow-sm shadow-primary/25 transition active:scale-[0.99]'

function HomeCta({ phase }: { phase: Phase }) {
  if (phase.mode === 'selling') {
    return (
      <Button asChild className={CTA_CLASS}>
        <Link to="/carrinho">Fazer meu pedido agora!</Link>
      </Button>
    )
  }
  if (phase.mode === 'redeeming') {
    return (
      <Button asChild className={CTA_CLASS}>
        <Link to="/pedidos">Ver meus pedidos</Link>
      </Button>
    )
  }
  const label =
    phase.mode === 'before'
      ? `Vendas abrem ${
          relativeDay(phase.now, phase.snapshot.salesOpenAt) ??
          dayMonth(phase.snapshot.salesOpenAt)
        }`
      : 'Vendas encerradas'
  return (
    <Button disabled className={CTA_CLASS}>
      {label}
    </Button>
  )
}

export function HomePage() {
  const { data: me } = useMe()
  const { phase, isError, refetch } = usePhase()
  const firstName = me?.name.split(' ')[0] ?? ''

  return (
    <div className="grid gap-5">
      <Logo className="mx-auto w-44" />

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Olá, {firstName}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Prepare-se para a semana mais saborosa do ano.
        </p>
      </div>

      {phase ? (
        <>
          <EventHero phase={phase} />
          <PickupInfo phase={phase} />
          <HomeCta phase={phase} />
          {(phase.mode === 'before' || phase.mode === 'selling') && (
            <p className="text-xs text-muted-foreground">
              As compras encerram em {dayMonth(phase.snapshot.salesCloseAt)}. Não
              deixe para a última hora.
            </p>
          )}
        </>
      ) : isError ? (
        <div className="grid gap-3 rounded-2xl bg-card p-5 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar as informações do evento.
          </p>
          <Button
            variant="outline"
            className="mx-auto h-10 rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary/5 hover:text-primary"
            onClick={() => refetch()}
          >
            <RotateCwIcon className="size-4" />
            Tentar de novo
          </Button>
        </div>
      ) : (
        <>
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-12 rounded-xl" />
        </>
      )}
    </div>
  )
}
