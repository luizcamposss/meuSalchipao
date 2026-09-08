import { Link } from 'react-router-dom'

import { TricolorBar } from '@/components/TricolorBar'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TricolorBar />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-6xl font-extrabold tracking-tight text-primary">404</p>
        <p className="mt-2 text-muted-foreground">Essa página não existe.</p>
        <Button asChild className="mt-6 h-12 rounded-xl px-6 font-semibold">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  )
}
