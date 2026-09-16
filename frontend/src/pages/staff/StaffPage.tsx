import {
  BanknoteIcon,
  HourglassIcon,
  LayersIcon,
  type LucideIcon,
  RotateCwIcon,
  ShoppingBagIcon,
  TicketCheckIcon,
} from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCreateSaleWindow,
  useDeleteSaleWindow,
  useEvent,
  useEventLive,
  useUpdateEvent,
  useUpdateSaleWindow,
} from '@/features/event/hooks'
import { useOrderStats } from '@/features/orders/hooks'
import { useSacQueue } from '@/features/sac/hooks'
import { STATUS_CLASS, STATUS_LABEL } from '@/features/sac/labels'
import { ApiError } from '@/lib/api'
import {
  formatDateTime,
  fromInputLocal,
  money,
  toInputLocal,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  EventPhaseSnapshot,
  ForcedPhase,
  OrderStats,
  SacTicketResponse,
  SacTicketStatus,
  SaleWindowResponse,
} from '@/types/api'

import { RedeemMeter, SalesBarChart, ShiftBarChart } from './SummaryCharts'
import { TicketDetail } from './TicketDetail'

const FILTERS: { label: string; value?: SacTicketStatus }[] = [
  { label: 'Todos' },
  { label: 'Abertos', value: 'Open' },
  { label: 'Em andamento', value: 'InProgress' },
  { label: 'Resolvidos', value: 'Resolved' },
]

const FORCED_OPTIONS: { value: ForcedPhase; label: string }[] = [
  { value: 'Auto', label: 'Automático (pelas datas)' },
  { value: 'SalesOnly', label: 'Forçar vendas abertas' },
  { value: 'RedemptionOnly', label: 'Forçar retirada' },
  { value: 'Closed', label: 'Forçar fechado' },
]

// ---- resumo do evento ---------------------------------------------

const ACCENT = {
  sales: 'bg-primary/10 text-primary',
  redeemed: 'bg-chart-redeemed/12 text-chart-redeemed',
  pending: 'bg-chart-pending/15 text-chart-pending',
  neutral: 'bg-secondary text-secondary-foreground',
} as const

function StatCard({
  icon: Icon,
  value,
  label,
  hint,
  accent = 'neutral',
  emphasis = false,
}: {
  icon: LucideIcon
  value: React.ReactNode
  label: string
  hint: string
  accent?: keyof typeof ACCENT
  emphasis?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 transition-shadow hover:shadow-md',
        emphasis ? 'ring-primary/25' : 'ring-border/60',
      )}
    >
      <span
        className={cn(
          'grid size-9 place-items-center rounded-xl',
          ACCENT[accent],
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <p
          className={cn(
            'font-bold leading-tight tabular-nums text-foreground',
            emphasis ? 'text-[1.75rem]' : 'text-2xl',
          )}
        >
          {value}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/60">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function SummaryDashboard() {
  const { data, isLoading, isError, refetch, isFetching } = useOrderStats()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar o resumo.
        </p>
        <Button
          variant="outline"
          className="h-9 rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary/5 hover:text-primary"
          onClick={() => refetch()}
        >
          <RotateCwIcon className="size-4" />
          Tentar de novo
        </Button>
      </div>
    )
  }

  const stats: OrderStats = data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span
            className={cn(
              'absolute inline-flex size-full rounded-full bg-chart-redeemed/60',
              isFetching && 'animate-ping',
            )}
          />
          <span className="relative inline-flex size-2 rounded-full bg-chart-redeemed" />
        </span>
        <span className="text-xs text-muted-foreground">
          Ao vivo · atualiza a cada 15s · só conta pedidos pagos
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={ShoppingBagIcon}
          value={stats.salchiposSold}
          label="Salchipões vendidos"
          hint="unidades em pedidos pagos"
          accent="sales"
        />
        <StatCard
          icon={BanknoteIcon}
          value={money(stats.revenue)}
          label="Total vendido"
          hint="soma dos pedidos pagos"
          accent="sales"
          emphasis
        />
        <StatCard
          icon={HourglassIcon}
          value={stats.ticketsToRedeem}
          label="A resgatar"
          hint="tickets pagos aguardando o balcão"
          accent="pending"
        />
        <StatCard
          icon={TicketCheckIcon}
          value={stats.ticketsRedeemed}
          label="Já resgatados"
          hint="tickets retirados no balcão"
          accent="redeemed"
        />
        <StatCard
          icon={LayersIcon}
          value={stats.ticketsGenerated}
          label="Tickets gerados"
          hint="pagos + resgatados, no total"
          accent="neutral"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Salchipões por dia"
            subtitle="unidades vendidas por data (horário de Brasília)"
          >
            <SalesBarChart data={stats.byDay} />
          </SectionCard>
        </div>
        <SectionCard
          title="Resgate no balcão"
          subtitle="quanto dos tickets pagos já foi retirado"
        >
          <RedeemMeter
            redeemed={stats.ticketsRedeemed}
            pending={stats.ticketsToRedeem}
          />
        </SectionCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <SectionCard
          title="Salchipões por turno"
          subtitle="unidades vendidas por turno de quem comprou"
        >
          <ShiftBarChart data={stats.byShift} />
        </SectionCard>
      </div>
    </div>
  )
}

// ---- fila do SAC ----------------------------------------------------

function QueueItem({
  t,
  active,
  onSelect,
}: {
  t: SacTicketResponse
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl bg-card p-3.5 text-left shadow-sm transition-colors',
        active
          ? 'ring-2 ring-primary'
          : 'ring-1 ring-transparent hover:bg-secondary/40',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold',
            STATUS_CLASS[t.status],
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {STATUS_LABEL[t.status]}
        </span>
        {t.priority === 'High' ? (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[0.625rem] font-semibold text-destructive">
            Alta
          </span>
        ) : null}
        <span className="ml-auto text-[0.625rem] text-muted-foreground">
          {formatDateTime(t.updatedAt)}
        </span>
      </div>
      <p className="mt-1.5 truncate font-semibold text-foreground">
        {t.subject}
      </p>
      <p className="truncate text-xs text-muted-foreground">
        {t.userName ?? t.description}
      </p>
    </button>
  )
}

function SacQueue() {
  const [filter, setFilter] = React.useState<SacTicketStatus | undefined>(
    undefined,
  )
  const [picked, setPicked] = React.useState<string | null>(null)
  const { data, isLoading, isError, refetch } = useSacQueue(filter)

  const shownId =
    data?.find((t) => t.id === picked)?.id ?? data?.[0]?.id ?? null

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,360px)_1fr]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <>
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar a fila.
            </p>
            <Button
              variant="outline"
              className="h-9 rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary/5 hover:text-primary"
              onClick={() => refetch()}
            >
              <RotateCwIcon className="size-4" />
              Tentar de novo
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
            Nenhum chamado{' '}
            {filter ? `com status "${STATUS_LABEL[filter]}"` : 'na fila'}.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.map((t) => (
              <QueueItem
                key={t.id}
                t={t}
                active={t.id === shownId}
                onSelect={() => setPicked(t.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="min-w-0">
        {shownId ? (
          <TicketDetail ticketId={shownId} />
        ) : (
          <div className="grid h-full min-h-[20rem] place-items-center rounded-3xl bg-card text-sm text-muted-foreground shadow-sm">
            Selecione um chamado à esquerda.
          </div>
        )}
      </div>
    </div>
  )
}

// ---- controle do evento ------------------------------------------

function EventForm({ snapshot }: { snapshot: EventPhaseSnapshot }) {
  const update = useUpdateEvent()
  const [salesOpenAt, setSalesOpenAt] = React.useState(() =>
    toInputLocal(snapshot.salesOpenAt),
  )
  const [salesCloseAt, setSalesCloseAt] = React.useState(() =>
    toInputLocal(snapshot.salesCloseAt),
  )
  const [redemptionOpensAt, setRedemptionOpensAt] = React.useState(() =>
    toInputLocal(snapshot.redemptionOpensAt),
  )
  const [forcedPhase, setForcedPhase] = React.useState<ForcedPhase>(
    snapshot.forcedPhase,
  )
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    try {
      await update.mutateAsync({
        salesOpenAt: fromInputLocal(salesOpenAt),
        salesCloseAt: fromInputLocal(salesCloseAt),
        redemptionOpensAt: fromInputLocal(redemptionOpensAt),
        forcedPhase,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    }
  }

  const field =
    'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

  return (
    <form
      onSubmit={save}
      className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-sm"
    >
      <p className="rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        Fase agora: <b className="text-foreground">{snapshot.phase}</b> · horários
        em horário de Brasília
      </p>

      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Abertura das vendas
        </span>
        <input
          type="datetime-local"
          className={field}
          value={salesOpenAt}
          onChange={(e) => setSalesOpenAt(e.target.value)}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fechamento das vendas
        </span>
        <input
          type="datetime-local"
          className={field}
          value={salesCloseAt}
          onChange={(e) => setSalesCloseAt(e.target.value)}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Abertura da retirada
        </span>
        <input
          type="datetime-local"
          className={field}
          value={redemptionOpensAt}
          onChange={(e) => setRedemptionOpensAt(e.target.value)}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fase forçada
        </span>
        <select
          className={field}
          value={forcedPhase}
          onChange={(e) => setForcedPhase(e.target.value as ForcedPhase)}
        >
          {FORCED_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-lg bg-flag-green/15 px-3 py-2 text-sm font-medium text-flag-green">
          Salvo.
        </p>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl font-semibold"
        disabled={update.isPending}
      >
        {update.isPending ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}

function EventControl() {
  const { data, isLoading, isError, refetch } = useEvent()

  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar o evento.
        </p>
        <Button
          variant="outline"
          className="h-9 rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary/5 hover:text-primary"
          onClick={() => refetch()}
        >
          <RotateCwIcon className="size-4" />
          Tentar de novo
        </Button>
      </div>
    )
  }
  return <EventForm snapshot={data} />
}

// ---- venda avulsa do dia -------------------------------------------

function SaleWindowMeter({ cap, remaining }: { cap: number; remaining: number }) {
  const pct = cap > 0 ? Math.min(100, Math.round(((cap - remaining) / cap) * 100)) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function SaleWindowEditForm({
  window: w,
  onDone,
}: {
  window: SaleWindowResponse
  onDone: () => void
}) {
  const update = useUpdateSaleWindow()
  const [label, setLabel] = React.useState(w.label)
  const [opensAt, setOpensAt] = React.useState(() => toInputLocal(w.opensAt))
  const [closesAt, setClosesAt] = React.useState(() => toInputLocal(w.closesAt))
  const [cap, setCap] = React.useState(String(w.cap))
  const [error, setError] = React.useState<string | null>(null)

  const field =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await update.mutateAsync({
        id: w.id,
        body: {
          label,
          opensAt: fromInputLocal(opensAt),
          closesAt: fromInputLocal(closesAt),
          cap: Number(cap),
        },
      })
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <input
        className={field}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nome da janela"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="datetime-local"
          className={field}
          value={opensAt}
          onChange={(e) => setOpensAt(e.target.value)}
        />
        <input
          type="datetime-local"
          className={field}
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
        />
      </div>
      <input
        type="number"
        min={1}
        className={field}
        value={cap}
        onChange={(e) => setCap(e.target.value)}
        placeholder="Cota"
      />
      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button
          type="submit"
          className="h-9 flex-1 rounded-lg text-sm"
          disabled={update.isPending}
        >
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-lg border-[1.5px] text-sm"
          onClick={onDone}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function SaleWindowRow({ window: w }: { window: SaleWindowResponse }) {
  const [editing, setEditing] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const del = useDeleteSaleWindow()

  if (editing) {
    return (
      <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
        <SaleWindowEditForm window={w} onDone={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-foreground">{w.label}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(w.opensAt)} — {formatDateTime(w.closesAt)}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold',
            w.open
              ? 'bg-flag-green/15 text-flag-green'
              : 'bg-secondary text-secondary-foreground',
          )}
        >
          {w.open ? 'Aberta agora' : 'Fechada'}
        </span>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold tabular-nums text-foreground">
          {w.remaining} de {w.cap} vagas
        </p>
        <SaleWindowMeter cap={w.cap} remaining={w.remaining} />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-8 flex-1 rounded-lg border-[1.5px] text-xs"
          onClick={() => setEditing(true)}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-8 flex-1 rounded-lg border-[1.5px] text-xs',
            confirmingDelete && 'border-destructive text-destructive',
          )}
          disabled={del.isPending}
          onClick={() => {
            if (!confirmingDelete) {
              setConfirmingDelete(true)
              return
            }
            del.mutate(w.id)
          }}
        >
          {del.isPending
            ? 'Excluindo…'
            : confirmingDelete
              ? 'Confirmar exclusão?'
              : 'Excluir'}
        </Button>
      </div>
    </div>
  )
}

function CreateSaleWindowForm() {
  const create = useCreateSaleWindow()
  const [label, setLabel] = React.useState('')
  const [opensAt, setOpensAt] = React.useState('')
  const [closesAt, setClosesAt] = React.useState('')
  const [cap, setCap] = React.useState('50')
  const [error, setError] = React.useState<string | null>(null)

  const field =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!label.trim() || !opensAt || !closesAt) {
      setError('Preenche nome, início e fim.')
      return
    }
    try {
      await create.mutateAsync({
        label: label.trim(),
        opensAt: fromInputLocal(opensAt),
        closesAt: fromInputLocal(closesAt),
        cap: Number(cap),
      })
      setLabel('')
      setOpensAt('')
      setClosesAt('')
      setCap('50')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar.')
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-dashed ring-border"
    >
      <p className="text-sm font-bold text-foreground">Nova janela</p>
      <input
        className={field}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nome (ex: Manhã)"
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Abre
          </span>
          <input
            type="datetime-local"
            className={field}
            value={opensAt}
            onChange={(e) => setOpensAt(e.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Fecha
          </span>
          <input
            type="datetime-local"
            className={field}
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
          />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Cota
        </span>
        <input
          type="number"
          min={1}
          className={field}
          value={cap}
          onChange={(e) => setCap(e.target.value)}
        />
      </label>
      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-9 rounded-lg text-sm"
        disabled={create.isPending}
      >
        {create.isPending ? 'Criando…' : 'Adicionar janela'}
      </Button>
    </form>
  )
}

function SaleWindowsPanel() {
  const { data, isLoading, isError, refetch, isFetching } = useEventLive()

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar as janelas de venda.
        </p>
        <Button
          variant="outline"
          className="h-9 rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary/5 hover:text-primary"
          onClick={() => refetch()}
        >
          <RotateCwIcon className="size-4" />
          Tentar de novo
        </Button>
      </div>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span
            className={cn(
              'absolute inline-flex size-full rounded-full bg-chart-redeemed/60',
              isFetching && 'animate-ping',
            )}
          />
          <span className="relative inline-flex size-2 rounded-full bg-chart-redeemed" />
        </span>
        <span className="text-xs text-muted-foreground">
          Ao vivo · atualiza a cada 5s
        </span>
      </div>

      {data.saleWindows.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          Nenhuma janela cadastrada ainda.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.saleWindows.map((w) => (
            <SaleWindowRow key={w.id} window={w} />
          ))}
        </div>
      )}

      <CreateSaleWindowForm />
    </div>
  )
}

// ---- página ------------------------------------------------------

const TABS = [
  { value: 'summary', label: 'Resumo' },
  { value: 'sac', label: 'Atendimento' },
  { value: 'event', label: 'Evento' },
  { value: 'walkup', label: 'Venda do dia' },
] as const

type StaffTab = (typeof TABS)[number]['value']

export function StaffPage() {
  const [tab, setTab] = React.useState<StaffTab>('summary')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex w-fit rounded-full bg-secondary/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              'rounded-full px-6 py-2 text-sm font-semibold transition-colors',
              tab === t.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary' ? (
        <SummaryDashboard />
      ) : tab === 'sac' ? (
        <SacQueue />
      ) : tab === 'event' ? (
        <div className="max-w-lg">
          <EventControl />
        </div>
      ) : (
        <SaleWindowsPanel />
      )}
    </div>
  )
}
