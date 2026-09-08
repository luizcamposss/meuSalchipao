import { LogOutIcon } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { TricolorBar } from '@/components/TricolorBar'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks'

/** Casca da área de Staff — layout de desktop, largo, sem barra de abas do aluno. */
export function StaffLayout() {
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TricolorBar />
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/staff" className="flex items-center gap-3">
            <Logo className="w-28" />
            <span className="hidden text-sm font-bold text-muted-foreground sm:block">
              Painel da equipe
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, {
                onSettled: () => navigate('/login', { replace: true }),
              })
            }
          >
            <LogOutIcon className="size-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
