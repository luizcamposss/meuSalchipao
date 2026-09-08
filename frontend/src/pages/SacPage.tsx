import {
  ChevronLeftIcon,
  PaperclipIcon,
  RotateCwIcon,
  SendIcon,
} from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useSacThread, useSendSacMessage } from '@/features/sac/hooks'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const QUICK_REPLIES = ['Ajuda com pedido', 'Retirada', 'Pagamento']

function Bubble({
  side,
  children,
  muted,
}: {
  side: 'left' | 'right'
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        'max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-snug',
        side === 'left'
          ? 'self-start rounded-bl-sm bg-card text-foreground shadow-sm'
          : 'self-end rounded-br-sm bg-primary text-primary-foreground',
        muted && 'opacity-60',
      )}
    >
      {children}
    </div>
  )
}

export function SacPage() {
  const navigate = useNavigate()
  const { activeId, messages, isLoading, isError } = useSacThread()
  const send = useSendSacMessage(activeId)

  const [text, setText] = React.useState('')
  const [pending, setPending] = React.useState<string[]>([])
  const [seenLen, setSeenLen] = React.useState(0)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // servidor confirmou mensagens novas -> limpa os otimistas
  if (messages.length > seenLen) {
    setSeenLen(messages.length)
    setPending([])
  }

  React.useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages.length, pending.length])

  const hasMessages = messages.length > 0 || pending.length > 0
  const showChips = !hasMessages
  const waitingReply =
    (messages.length > 0 && messages.every((m) => !m.fromStaff)) ||
    (messages.length === 0 && pending.length > 0)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || send.isPending) return
    setText('')
    setPending((p) => [...p, t])
    send.mutate(t, {
      onError: () => {
        setPending((p) => p.filter((x) => x !== t))
        setText(t)
      },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-foreground shadow-sm transition-transform active:scale-95"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Atendimento SAC
          </h1>
          <p className="text-sm text-muted-foreground">
            Converse com nossa equipe sem sair do app.
          </p>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm">
        <div className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-flag-yellow font-extrabold text-foreground ring-2 ring-white/20">
            S
          </span>
          <div className="leading-tight">
            <p className="font-bold">SAC Meu Salchipão</p>
            <p className="flex items-center gap-1.5 text-xs text-primary-foreground/85">
              <span className="inline-block size-1.5 rounded-full bg-flag-green" />
              Online · responde em instantes
            </p>
          </div>
        </div>

        <div
          ref={bodyRef}
          className="flex max-h-[58vh] min-h-[300px] flex-col gap-2.5 overflow-y-auto bg-secondary/25 px-4 py-4"
        >
          {isError ? (
            <div className="m-auto flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar o atendimento.
              </p>
              <Button
                variant="outline"
                className="h-9 rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary/5 hover:text-primary"
                onClick={() => window.location.reload()}
              >
                <RotateCwIcon className="size-4" />
                Recarregar
              </Button>
            </div>
          ) : (
            <>
              <span className="mx-auto rounded-full bg-secondary px-3 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                {messages[0]
                  ? `Hoje, ${formatTime(messages[0].createdAt)}`
                  : 'Hoje'}
              </span>

              <Bubble side="left">
                Olá! Aqui é o time do SAC do Meu Salchipão. Conta pra gente como
                podemos ajudar. 👇
              </Bubble>

              {showChips ? (
                <div className="flex flex-wrap gap-2 py-1">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setText(q)
                        inputRef.current?.focus()
                      }}
                      className="rounded-full border border-primary/25 bg-card px-3 py-1 text-xs font-semibold text-primary transition-transform active:scale-95"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : null}

              {isLoading && !hasMessages ? (
                <span className="mx-auto text-xs text-muted-foreground">
                  carregando…
                </span>
              ) : null}

              {messages.map((m) => (
                <Bubble key={m.id} side={m.fromStaff ? 'left' : 'right'}>
                  {m.message}
                </Bubble>
              ))}

              {pending.map((t, i) => (
                <Bubble key={`p${i}`} side="right" muted>
                  {t}
                </Bubble>
              ))}

              {waitingReply ? (
                <span className="self-start text-xs italic text-muted-foreground">
                  A equipe responde em instantes…
                </span>
              ) : null}
            </>
          )}
        </div>

        <form
          onSubmit={submit}
          className="flex items-center gap-2 border-t border-border bg-card p-3"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-input bg-background px-3.5 py-2">
            <PaperclipIcon
              className="size-[1.15rem] shrink-0 text-muted-foreground/60"
              aria-hidden
            />
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite sua mensagem…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim() || send.isPending}
            aria-label="Enviar"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-40"
          >
            <SendIcon className="size-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
