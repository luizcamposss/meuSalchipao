import * as React from 'react'
import { Link, useParams } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { SlideToConfirm } from '@/components/SlideToConfirm'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePhase } from '@/features/event/hooks'
import { useRedeem, useTicket } from '@/features/orders/hooks'
import { ApiError } from '@/lib/api'
import { formatTime, money, orderCode } from '@/lib/format'
import { cn } from '@/lib/utils'

export function TicketPage() {
  const { orderId = '' } = useParams()
  const { data: ticket, isLoading, isError } = useTicket(orderId)
  const { phase } = usePhase()
  const redeem = useRedeem(orderId)

  const [redeemError, setRedeemError] = React.useState<string | null>(null)

  const redeeming = phase?.mode === 'redeeming'
  const isRedeemed = ticket?.status === 'Redeemed'
  const canRedeem = redeeming && ticket?.status === 'Paid'

  async function handleConfirm() {
    setRedeemError(null)
    try {
      await redeem.mutateAsync()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setRedeemError(err.message || 'A retirada não está disponível.')
      } else {
        setRedeemError('Não foi possível confirmar a retirada.')
      }
    }
  }

  const statusPill = isRedeemed
    ? { text: 'Já retirado', className: 'bg-secondary text-muted-foreground' }
    : canRedeem
      ? { text: 'Disponível no balcão', className: 'bg-flag-green/15 text-flag-green' }
      : { text: 'Aguardando abertura da retirada', className: 'bg-flag-yellow/25 text-foreground' }

  return (
    <div className="flex flex-col gap-4">
      <Logo className="mx-auto w-40" />

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Seu ticket
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apresente este ingresso no balcão para retirar.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : isError || !ticket ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Este pedido ainda não tem um ticket de retirada.
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
        <div className="rounded-3xl shadow-sm">
          <div className="rounded-t-3xl bg-primary px-6 py-7 text-center">
            <p className="text-xl font-extrabold uppercase tracking-[0.2em] text-primary-foreground">
              Ticket Retirada
            </p>
          </div>

          {/* serrilha */}
          <div className="relative h-0">
            <div className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-background" />
            <div className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-background" />
            <div className="border-t border-dashed border-primary/40" />
          </div>

          <div className="rounded-b-3xl bg-card px-6 py-6 text-center">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Código de retirada
            </p>
            <p className="mt-1 text-6xl font-extrabold tracking-[0.12em] text-primary">
              {String(ticket.pickupNumber ?? 0).padStart(3, '0')}
            </p>

            <span
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                statusPill.className,
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {statusPill.text}
            </span>

            <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl bg-secondary/60 px-4 py-3 text-left">
              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Pedido
                </p>
                <p className="font-mono text-sm font-bold text-foreground">
                  #{orderCode(ticket.orderId)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
                <p className="font-mono text-sm font-bold text-primary">
                  {money(ticket.total)}
                </p>
              </div>
            </div>

            {isRedeemed ? (
              <div className="mt-5 rounded-xl bg-flag-green/15 px-4 py-3 text-sm font-semibold text-flag-green">
                Retirado às {formatTime(ticket.redeemedAt ?? ticket.createdAt)}
              </div>
            ) : (
              <>
                <p className="mt-5 text-xs text-muted-foreground">
                  Mostre este código à equipe. Confirme somente quando estiver no
                  balcão.
                </p>
                {redeemError ? (
                  <p className="mt-2 text-sm font-medium text-destructive">
                    {redeemError}
                  </p>
                ) : null}
                <div className="mt-3">
                  <SlideToConfirm
                    label={
                      canRedeem
                        ? 'Deslize para confirmar'
                        : 'Retirada ainda não abriu'
                    }
                    onConfirm={handleConfirm}
                    disabled={!canRedeem}
                    loading={redeem.isPending}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
