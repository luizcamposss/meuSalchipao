import { RotateCwIcon } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEvent, useUpdateEvent } from '@/features/event/hooks'
import { useSacQueue } from '@/features/sac/hooks'
import { STATUS_CLASS, STATUS_LABEL } from '@/features/sac/labels'
import { ApiError } from '@/lib/api'
import { formatDateTime, fromInputLocal, orderCode, toInputLocal } from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  EventPhaseSnapshot,
  ForcedPhase,
  SacTicketResponse,
  SacTicketStatus,
} from '@/types/api'

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

// ---- fila do SAC ----------------------------------------------------

function TicketCard({ t }: { t: SacTicketResponse }) {
  return (
    <Link
      to={`/staff/sac/${t.id}`}
      className="block rounded-2xl bg-card p-4 shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold',
            STATUS_CLASS[t.status],
          )}
        >
          {STATUS_LABEL[t.status]}
        </span>
        {t.priority === 'High' ? (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-destructive">
            Alta
          </span>
        ) : null}
        <span className="ml-auto text-[0.6875rem] text-muted-foreground">
          {formatDateTime(t.updatedAt)}
        </span>
      </div>
      <p className="mt-2 font-semibold text-foreground">{t.subject}</p>
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {t.description}
      </p>
      {t.orderId ? (
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          pedido #{orderCode(t.orderId)}
        </p>
      ) : null}
    </Link>
  )
}

function SacQueue() {
  const [filter, setFilter] = React.useState<SacTicketStatus | undefined>(
    undefined,
  )
  const { data, isLoading, isError, refetch } = useSacQueue(filter)

  return (
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
                : 'bg-card text-muted-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
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
          Nenhum chamado {filter ? `com status "${STATUS_LABEL[filter]}"` : ''}.
        </p>
      ) : (
        data.map((t) => <TicketCard key={t.id} t={t} />)
      )}
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
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível salvar.',
      )
    }
  }

  const field =
    'h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
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

  if (isLoading) return <Skeleton className="h-80 rounded-2xl" />
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-sm">
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

// ---- página ------------------------------------------------------

export function StaffPage() {
  const [tab, setTab] = React.useState<'sac' | 'event'>('sac')

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
        Painel
      </h1>

      <div className="flex rounded-full bg-card p-1 shadow-sm">
        {(['sac', 'event'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-full py-2 text-sm font-semibold transition-colors',
              tab === t
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )}
          >
            {t === 'sac' ? 'Atendimento' : 'Evento'}
          </button>
        ))}
      </div>

      {tab === 'sac' ? <SacQueue /> : <EventControl />}
    </div>
  )
}
