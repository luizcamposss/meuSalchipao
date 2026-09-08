import { ChevronLeftIcon, SendIcon } from 'lucide-react'
import * as React from 'react'
import { Link, useParams } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { useSacTicket, useStaffReply, useUpdateTicket } from '@/features/sac/hooks'
import { formatDateTime, orderCode } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/features/sac/labels'
import type { SacTicketPriority, SacTicketStatus } from '@/types/api'

const STATUSES: SacTicketStatus[] = ['Open', 'InProgress', 'Resolved', 'Closed']
const PRIORITIES: SacTicketPriority[] = ['Low', 'Normal', 'High']

function Bubble({
  side,
  children,
}: {
  side: 'left' | 'right'
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-snug',
        side === 'right'
          ? 'self-end rounded-br-sm bg-primary text-primary-foreground'
          : 'self-start rounded-bl-sm bg-card text-foreground shadow-sm',
      )}
    >
      {children}
    </div>
  )
}

export function StaffTicketPage() {
  const { ticketId = '' } = useParams()
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

  const selectCls =
    'h-9 rounded-lg border border-input bg-card px-2 text-xs font-semibold outline-none focus-visible:border-ring'

  return (
    <div className="flex flex-col gap-3">
      <Link
        to="/staff"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeftIcon className="size-4" />
        Fila
      </Link>

      {isLoading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : isError || !ticket ? (
        <p className="rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          Chamado não encontrado.
        </p>
      ) : (
        <>
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="font-bold text-foreground">{ticket.subject}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              aluno #{orderCode(ticket.userId)}
              {ticket.orderId ? ` · pedido #${orderCode(ticket.orderId)}` : ''}
            </p>
            <p className="mt-1 text-[0.6875rem] text-muted-foreground">
              aberto em {formatDateTime(ticket.createdAt)}
            </p>

            <div className="mt-3 flex gap-2">
              <select
                className={selectCls}
                value={ticket.status}
                disabled={update.isPending}
                onChange={(e) =>
                  update.mutate({
                    status: e.target.value as SacTicketStatus,
                  })
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
                    Prioridade: {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm">
            <div
              ref={bodyRef}
              className="flex max-h-[52vh] min-h-[240px] flex-col gap-2.5 overflow-y-auto bg-secondary/25 px-4 py-4"
            >
              <Bubble side="left">{ticket.description}</Bubble>
              {messages.map((m) => (
                <Bubble key={m.id} side={m.fromStaff ? 'right' : 'left'}>
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
                placeholder={
                  closed ? 'Chamado fechado' : 'Responder ao aluno…'
                }
                className="min-w-0 flex-1 rounded-full border border-input bg-background px-3.5 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!text.trim() || reply.isPending || closed}
                aria-label="Enviar"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-40"
              >
                <SendIcon className="size-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
