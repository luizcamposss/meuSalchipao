import { RotateCwIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEvent, useUpdateEvent } from '@/features/event/hooks'
import { useSacQueue } from '@/features/sac/hooks'
import { STATUS_CLASS, STATUS_LABEL } from '@/features/sac/labels'
import { ApiError } from '@/lib/api'
import { formatDateTime, fromInputLocal, toInputLocal } from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  EventPhaseSnapshot,
  ForcedPhase,
  SacTicketResponse,
  SacTicketStatus,
} from '@/types/api'

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

// ---- página ------------------------------------------------------

export function StaffPage() {
  const [tab, setTab] = React.useState<'sac' | 'event'>('sac')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex w-fit rounded-full bg-secondary/60 p-1">
        {(['sac', 'event'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full px-6 py-2 text-sm font-semibold transition-colors',
              tab === t
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            {t === 'sac' ? 'Atendimento' : 'Evento'}
          </button>
        ))}
      </div>

      {tab === 'sac' ? <SacQueue /> : <div className="max-w-lg"><EventControl /></div>}
    </div>
  )
}
