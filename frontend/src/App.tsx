import { Button } from '@/components/ui/button'

/**
 * Placeholder do F0 — só prova que o scaffold funciona:
 * Vite + React + TS, Tailwind v4, tokens do tema Farroupilha e shadcn/ui.
 * O F1 substitui isto pelo shell do app (providers + router).
 */
export default function App() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          meu salchipão
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Semana Farroupilha · scaffold pronto (F0)
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button>Primária</Button>
        <Button variant="secondary">Secundária</Button>
        <Button variant="outline">Contorno</Button>
      </div>

      <div className="grid w-full grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-primary p-3 text-primary-foreground">primary</div>
        <div className="rounded-md bg-secondary p-3 text-secondary-foreground">secondary</div>
        <div className="rounded-md bg-accent p-3 text-accent-foreground">accent</div>
      </div>
    </div>
  )
}
