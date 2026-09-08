import { LogOutIcon } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

import { TricolorBar } from '@/components/TricolorBar'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks'

/** Casca da área de Staff — sem a barra de abas do aluno. */
export function StaffLayout() {
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <TricolorBar />
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <Link to="/staff" className="text-sm font-extrabold text-primary">
          Painel · Meu Salchipão
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
      </header>
      <main className="flex-1 px-5 py-6">
        <Outlet />
      </main>
    </div>
  )
}
