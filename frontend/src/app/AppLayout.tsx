import { LogOutIcon } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

import { TricolorBar } from '@/components/TricolorBar'
import { Button } from '@/components/ui/button'
import { useLogout, useMe } from '@/features/auth/hooks'

/**
 * Casca mobile do miolo logado: faixa tricolor, header com wordmark + sair,
 * e o <Outlet>. As telas seguintes (F2+) acrescentam navegação e o badge
 * de fase do evento.
 */
export function AppLayout() {
  const { data: me } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <TricolorBar />
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
        <Link to="/" className="text-lg font-extrabold tracking-tight text-primary">
          Meu Salchipão
        </Link>
        {me ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOutIcon className="size-4" />
            Sair
          </Button>
        ) : null}
      </header>

      <main className="flex-1 px-4 py-5">
        <Outlet />
      </main>
    </div>
  )
}
