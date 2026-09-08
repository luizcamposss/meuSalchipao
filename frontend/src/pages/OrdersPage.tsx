import { RotateCwIcon, TicketIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePhase } from '@/features/event/hooks'
import { useOrders } from '@/features/orders/hooks'
import { formatTime, longDate, money, orderCode } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderResponse } from '@/types/api'

type View = {
  pill: string
  pillClass: string
  action: { label: string; to: string } | null
}

function viewFor(order: OrderResponse, redeeming: boolean): View {
  const to = `/pedidos/${order.id}`
  switch (order.status) {
    case 'AwaitingPayment':
      return {
        pill: 'Aguardando pagamento',
        pillClass: 'bg-flag-yellow/25 text-foreground',
        action: { label: 'Pagar pedido', to },
      }
    case 'Paid':
      return {
        pill: redeeming ? 'Pronto para retirada' : 'Pagamento confirmado',
        pillClass: 'bg-flag-green/20 text-flag-green',
        action: { label: 'Abrir ticket de retirada', to: `${to}/ticket` },
      }
    case 'Redeemed':
      return {
        pill: 'Retirado',
        pillClass: 'bg-secondary text-muted-foreground',
        action: { label: 'Ver ticket', to: `${to}/ticket` },
      }
    case 'Cancelled':
      return {
        pill: 'Cancelado',
        pillClass: 'bg-destructive/10 text-destructive',
        action: null,
      }
  }
}

function OrderCard({
  order,
  redeeming,
}: {
  order: OrderResponse
  redeeming: boolean
}) {
  const v = viewFor(order, redeeming)
  const summary = order.items
    .map((i) => `${i.quantity}× ${i.productName}`)
    .join(', ')

  return (
    <div className="rounded-3xl bg-card p-5 shadow-sm">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
          v.pillClass,
        )}
      >
        <span className="size-1.5 rounded-full bg-current" />
        {v.pill}
      </span>

      <p className="mt-3 font-mono text-base font-bold text-foreground">
        Pedido #{orderCode(order.id)}
      </p>
      <p className="text-xs text-muted-foreground">
        {longDate(order.createdAt)} · {formatTime(order.createdAt)}
      </p>

      <div className="my-4 rounded-2xl bg-secondary/60 px-4 py-3">
        <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Seu pedido
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="text-sm text-foreground">{summary}</span>
          <span className="shrink-0 text-lg font-extrabold text-primary">
            {money(order.total)}
          </span>
        </div>
      </div>

      {v.action ? (
        <Button
          asChild
          className="h-12 w-full rounded-xl text-[15px] font-semibold shadow-sm shadow-primary/25 transition active:scale-[0.99]"
        >
          <Link to={v.action.to}>
            <TicketIcon className="size-[1.15rem]" />
            {v.action.label}
          </Link>
        </Button>
      ) : null}
    </div>
  )
}

export function OrdersPage() {
  const { data: orders, isLoading, isError, refetch } = useOrders()
  const { phase } = usePhase()
  const redeeming = phase?.mode === 'redeeming'

  return (
    <div className="flex flex-col gap-4">
      <Logo className="mx-auto w-40" />

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Meus pedidos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe seus pedidos e retire sem espera.
        </p>
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-52 rounded-3xl" />
          <Skeleton className="h-52 rounded-3xl" />
        </>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar seus pedidos.
          </p>
          <Button
            variant="outline"
            className="h-10 rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary/5 hover:text-primary"
            onClick={() => refetch()}
          >
            <RotateCwIcon className="size-4" />
            Tentar de novo
          </Button>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Você ainda não fez nenhum pedido.
          </p>
          <Button asChild className="h-10 rounded-xl px-5 font-semibold">
            <Link to="/carrinho">Fazer um pedido</Link>
          </Button>
        </div>
      ) : (
        orders.map((order) => (
          <OrderCard key={order.id} order={order} redeeming={redeeming} />
        ))
      )}
    </div>
  )
}
