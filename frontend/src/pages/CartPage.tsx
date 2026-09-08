import { RotateCwIcon, ShoppingBagIcon } from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'

import productPhoto from '@/assets/product.webp'
import { Logo } from '@/components/Logo'
import { QuantityStepper } from '@/components/QuantityStepper'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useSalchipao } from '@/features/catalog/hooks'
import { usePhase } from '@/features/event/hooks'
import { useCreateOrder } from '@/features/orders/hooks'
import { ApiError } from '@/lib/api'
import { longDate, money } from '@/lib/format'
import { usePersistentState } from '@/lib/usePersistentState'
import { cn } from '@/lib/utils'

const MAX_QTY = 4

export function CartPage() {
  const navigate = useNavigate()
  const { product, isLoading, isError, refetch } = useSalchipao()
  const { phase } = usePhase()
  const createOrder = useCreateOrder()

  const [qty, setQty] = usePersistentState('cart:qty', 1)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const selling = phase?.mode === 'selling'
  const atMax = qty >= MAX_QTY

  const ctaLabel = selling
    ? 'Finalizar pedido'
    : phase?.mode === 'before'
      ? 'Vendas ainda não abriram'
      : 'Vendas encerradas'

  async function handleConfirm() {
    if (!product || !selling) return
    setFormError(null)
    try {
      const order = await createOrder.mutateAsync({
        items: [{ productId: product.id, quantity: qty }],
      })
      setConfirmOpen(false)
      navigate(`/pedidos/${order.id}`)
    } catch (err) {
      if (err instanceof ApiError && (err.status === 409 || err.status === 400)) {
        setFormError(err.message || 'Não foi possível criar o pedido.')
      } else {
        setFormError('Algo deu errado. Tente de novo.')
      }
    }
  }

  return (
    <div className="grid gap-4">
      <Logo className="mx-auto w-44" />

      <div className="rounded-3xl bg-card p-5 shadow-sm">
        {isError ? (
          <div className="grid gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar o produto.
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
        ) : isLoading || !product ? (
          <div className="grid gap-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {product.name}
            </h1>
            <p className="mt-1 text-sm font-medium text-primary">
              {product.description}
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <img
                src={productPhoto}
                alt={product.name}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="my-4 h-px bg-border" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Quantidade
                </p>
                <p
                  className={cn(
                    'text-xs',
                    atMax
                      ? 'font-medium text-primary'
                      : 'text-muted-foreground',
                  )}
                >
                  {atMax
                    ? `Máximo de ${MAX_QTY} por pedido.`
                    : `Você pode pedir até ${MAX_QTY}.`}
                </p>
              </div>
              <QuantityStepper
                value={qty}
                onChange={setQty}
                min={1}
                max={MAX_QTY}
                disabled={!selling}
              />
            </div>

            <div className="mt-4 flex items-end justify-between rounded-2xl bg-secondary/60 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-[0.6875rem] text-muted-foreground">
                  {qty} × {money(product.price)}
                </p>
              </div>
              <p className="text-2xl font-extrabold text-primary">
                {money(product.price * qty)}
              </p>
            </div>

            <Button
              className="mt-4 h-12 w-full rounded-xl text-[15px] font-semibold shadow-sm shadow-primary/25 transition active:scale-[0.99]"
              disabled={!selling}
              onClick={() => {
                setFormError(null)
                setConfirmOpen(true)
              }}
            >
              <ShoppingBagIcon className="size-[1.15rem]" />
              {ctaLabel}
            </Button>

            {phase ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Retirada no dia {longDate(phase.snapshot.redemptionOpensAt)}, no
                balcão.
              </p>
            ) : null}

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar pedido</DialogTitle>
                  <DialogDescription>
                    Revise antes de ir para o pagamento.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex items-baseline justify-between rounded-2xl bg-secondary/60 px-4 py-3">
                  <span className="text-sm text-foreground">
                    {qty}× {product.name}
                  </span>
                  <span className="text-xl font-extrabold text-primary">
                    {money(product.price * qty)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  O pagamento é no Pix, na próxima etapa. Depois de pago, não há
                  estorno.
                </p>

                {formError ? (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    {formError}
                  </p>
                ) : null}

                <DialogFooter>
                  <Button
                    className="h-11 w-full rounded-xl text-[15px] font-semibold"
                    disabled={createOrder.isPending}
                    onClick={handleConfirm}
                  >
                    {createOrder.isPending
                      ? 'Criando pedido…'
                      : 'Confirmar e pagar'}
                  </Button>
                  <DialogClose asChild>
                    <Button
                      variant="ghost"
                      className="h-10 w-full rounded-xl text-muted-foreground hover:text-foreground"
                      disabled={createOrder.isPending}
                    >
                      Cancelar
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}
