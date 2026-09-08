import { SendIcon } from 'lucide-react'
import * as React from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { useSacTicket, useStaffReply, useUpdateTicket } from '@/features/sac/hooks'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/features/sac/labels'
import { formatDateTime, formatTime, orderCode } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SacTicketPriority, SacTicketStatus } from '@/types/api'

const STATUSES: SacTicketStatus[] = ['Open', 'InProgress', 'Resolved', 'Closed']
const PRIORITIES: SacTicketPriority[] = ['Low', 'Normal', 'High']

function Bubble({
  side,
  time,
  children,
}: {
  side: 'left' | 'right'
  time?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        side === 'right' ? 'items-end' : 'items-start',
      )}
    >
      <div
        className={cn(
          'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-snug',
          side === 'right'
            ? 'rounded-br-md bg-primary text-primary-foreground shadow-sm shadow-primary/20'
            : 'rounded-bl-md bg-card text-foreground shadow-sm ring-1 ring-black/5',
        )}
      >
        {children}
      </div>
      {time ? (
        <span className="text-[0.625rem] text-muted-foreground">{time}</span>
      ) : null}
    </div>
  )
}

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading, isError } = useSacTicket(ticketId)
  const reply = useStaffReply(ticketId)
  const update = useUpdateTicket(ticketId)

  const [text, setText] = React.useState('')
  const bodyRef = React.useRef<HTMLDivElement>(null)

  const messages = ticket?.messages ?? []
  const closed = ticket?.status === 'Closed'

  React.useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages.length])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || reply.isPending || closed) return
    setText('')
    reply.mutate(t, { onError: () => setText(t) })
  }

  if (isLoading) return <Skeleton className="h-[32rem] w-full rounded-3xl" />
  if (isError || !ticket) {
    return (
      <p className="rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
        Chamado não encontrado.
      </p>
    )
  }

  const selectCls =
    'h-9 rounded-lg border border-input bg-background px-2 text-xs font-semibold outline-none focus-visible:border-ring'

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-foreground">
              {ticket.userName ?? 'Aluno'}
            </p>
            {ticket.userEmail ? (
              <p className="truncate text-sm text-muted-foreground">
                {ticket.userEmail}
              </p>
            ) : null}
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              matrícula {ticket.userEnrollment ?? '—'}
              {ticket.orderId ? ` · pedido #${orderCode(ticket.orderId)}` : ''}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <select
              className={selectCls}
              value={ticket.status}
              disabled={update.isPending}
              onChange={(e) =>
                update.mutate({ status: e.target.value as SacTicketStatus })
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <select
              className={selectCls}
              value={ticket.priority}
              disabled={update.isPending}
              onChange={(e) =>
                update.mutate({
                  priority: e.target.value as SacTicketPriority,
                })
              }
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 border-t border-dashed border-border pt-3">
          <p className="text-sm font-semibold text-foreground">
            {ticket.subject}
          </p>
          <p className="text-xs text-muted-foreground">
            aberto em {formatDateTime(ticket.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm">
        <div
          ref={bodyRef}
          className="flex max-h-[52vh] min-h-[240px] flex-col gap-2.5 overflow-y-auto bg-secondary/25 px-4 py-4"
        >
          <Bubble side="left">{ticket.description}</Bubble>
          {messages.map((m) => (
            <Bubble
              key={m.id}
              side={m.fromStaff ? 'right' : 'left'}
              time={formatTime(m.createdAt)}
            >
              {m.message}
            </Bubble>
          ))}
        </div>

        <form
          onSubmit={submit}
          className="flex items-center gap-2 border-t border-border bg-card p-3"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={closed}
            placeholder={closed ? 'Chamado fechado' : 'Responder ao aluno…'}
            className="min-w-0 flex-1 rounded-full border border-input bg-background px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!text.trim() || reply.isPending || closed}
            aria-label="Enviar"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/25 transition-transform active:scale-95 disabled:opacity-40 disabled:shadow-none"
          >
            <SendIcon className="size-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
