import { useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2Icon,
  CopyIcon,
  RotateCwIcon,
  XCircleIcon,
} from 'lucide-react'
import * as React from 'react'
import { Link, useParams } from 'react-router-dom'

import { Countdown } from '@/components/Countdown'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { orderKeys, useOrder } from '@/features/orders/hooks'
import { useOrderCharge, usePaymentStatus } from '@/features/payments/hooks'
import { formatDateTime, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderResponse } from '@/types/api'

const dashed = 'border-t border-dashed border-border'

function shortId(id: string) {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function Receipt({ order }: { order: OrderResponse }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-sm font-semibold text-foreground">
          Pedido #{shortId(order.id)}
        </p>
        <p className="shrink-0 text-xs text-muted-foreground">
          {formatDateTime(order.createdAt)}
        </p>
      </div>

      <ul className={cn(dashed, 'flex flex-col gap-1.5 pt-3 text-sm')}>
        {order.items.map((it) => (
          <li key={it.productId} className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              {it.quantity}× {it.productName}
            </span>
            <span className="shrink-0 font-mono">
              {money(it.unitPrice * it.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className={cn(dashed, 'flex items-baseline justify-between gap-2 pt-3')}>
        <span className="font-semibold">Total</span>
        <span className="shrink-0 font-mono text-lg font-extrabold text-primary">
          {money(order.total)}
        </span>
      </div>
    </div>
  )
}

function PixPayment({
  orderId,
  order,
}: {
  orderId: string
  order: OrderResponse
}) {
  const qc = useQueryClient()
  const charge = useOrderCharge(orderId)
  const paymentId = charge.data?.paymentId
  const status = usePaymentStatus(paymentId)
  const [copied, setCopied] = React.useState(false)

  const current = status.data ?? charge.data
  const approved = current?.status === 'Approved'
  const dead =
    current != null &&
    (current.status === 'Rejected' ||
      current.status === 'Expired' ||
      current.status === 'Refunded')

  React.useEffect(() => {
    if (approved) {
      void qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      void qc.invalidateQueries({ queryKey: orderKeys.list })
    }
  }, [approved, orderId, qc])

  async function copy() {
    if (!charge.data?.pixCode) return
    try {
      await navigator.clipboard.writeText(charge.data.pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      void 0
    }
  }

  if (charge.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="mx-auto size-48 rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    )
  }

  if (charge.isError || !charge.data) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          Não foi possível gerar a cobrança Pix.
        </p>
        <Button
          variant="outline"
          className="h-10 rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary/5 hover:text-primary"
          onClick={() => charge.refetch()}
        >
          <RotateCwIcon className="size-4" />
          Tentar de novo
        </Button>
      </div>
    )
  }

  const { pixCode, pixQrCodeBase64, expiresAt } = charge.data

  return (
    <div className="flex flex-col gap-4">
      <Receipt order={order} />

      <div className={cn(dashed, 'pt-4')}>
        {approved ? null : dead ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-medium text-destructive">
              Este código expirou ou foi recusado.
            </p>
            <Button
              className="h-10 rounded-xl px-5 font-semibold"
              onClick={() => charge.refetch()}
            >
              <RotateCwIcon className="size-4" />
              Gerar novo código
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                Pague com Pix
              </p>
              <p className="shrink-0 text-xs text-muted-foreground">
                expira em{' '}
                <Countdown
                  to={expiresAt}
                  onExpire={() => status.refetch()}
                  className="font-mono font-semibold text-foreground"
                />
              </p>
            </div>

            {pixQrCodeBase64 ? (
              <img
                src={`data:image/png;base64,${pixQrCodeBase64}`}
                alt="QR Code do Pix"
                className="mx-auto size-52 rounded-xl border border-border bg-white p-2"
              />
            ) : null}

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Pix copia e cola
              </p>
              <div className="overflow-x-auto rounded-lg bg-secondary px-3 py-2">
                <p className="whitespace-nowrap font-mono text-xs text-foreground">
                  {pixCode}
                </p>
              </div>
              <Button
                onClick={copy}
                variant="outline"
                className="mt-2 h-10 w-full rounded-lg border-[1.5px] border-primary text-sm font-semibold text-primary hover:bg-primary/5 hover:text-primary"
              >
                <CopyIcon className="size-4" />
                {copied ? 'Código copiado!' : 'Copiar código'}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Assim que o pagamento cair, esta tela atualiza sozinha.
            </p>
          </div>
        )}
      </div>

      <Button
        asChild
        variant="outline"
        className="h-11 w-full rounded-xl border-[1.5px] border-primary text-sm font-semibold text-primary hover:bg-primary/5 hover:text-primary"
      >
        <Link to="/pedidos">Voltar aos pedidos</Link>
      </Button>
    </div>
  )
}

const STATUS: Record<
  OrderResponse['status'],
  { label: string; className: string }
> = {
  AwaitingPayment: {
    label: 'Aguardando pagamento',
    className: 'bg-flag-yellow/25 text-foreground',
  },
  Paid: { label: 'Pago', className: 'bg-flag-green/20 text-flag-green' },
  Redeemed: {
    label: 'Retirado',
    className: 'bg-secondary text-muted-foreground',
  },
  Cancelled: {
    label: 'Cancelado',
    className: 'bg-destructive/10 text-destructive',
  },
}

export function OrderPage() {
  const { orderId = '' } = useParams()
  const { data: order, isLoading, isError } = useOrder(orderId)

  return (
    <div className="flex flex-col gap-4">
      <Logo className="mx-auto w-44" />

      <div className="overflow-hidden rounded-3xl bg-card p-5 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-48 w-full rounded-xl" />
          </div>
        ) : isError || !order ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Pedido não encontrado.
            </p>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary/5 hover:text-primary"
            >
              <Link to="/pedidos">Ver meus pedidos</Link>
            </Button>
          </div>
        ) : (
          <>
            <span
              className={cn(
                'mb-4 inline-block rounded-full px-2.5 py-1 text-xs font-semibold',
                STATUS[order.status].className,
              )}
            >
              {STATUS[order.status].label}
            </span>

            {order.status === 'AwaitingPayment' ? (
              <PixPayment orderId={orderId} order={order} />
            ) : order.status === 'Paid' ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <CheckCircle2Icon className="size-12 text-flag-green" />
                  <p className="text-lg font-extrabold text-foreground">
                    Pagamento confirmado!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Seu ticket digital fica disponível para a retirada.
                  </p>
                </div>
                <Receipt order={order} />
                <div className="flex flex-col gap-2">
                  <Button
                    asChild
                    className="h-11 w-full rounded-xl font-semibold"
                  >
                    <Link to={`/pedidos/${order.id}/ticket`}>
                      Ver ticket de retirada
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-10 w-full rounded-xl text-muted-foreground hover:text-foreground"
                  >
                    <Link to="/pedidos">Voltar aos pedidos</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  {order.status === 'Cancelled' ? (
                    <XCircleIcon className="size-12 text-destructive" />
                  ) : (
                    <CheckCircle2Icon className="size-12 text-muted-foreground" />
                  )}
                  <p className="text-lg font-extrabold text-foreground">
                    {order.status === 'Cancelled'
                      ? 'Pedido cancelado'
                      : 'Pedido retirado'}
                  </p>
                </div>
                <Receipt order={order} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
