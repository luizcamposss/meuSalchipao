import { LogOutIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useLogout, useMe } from '@/features/auth/hooks'

export function ProfilePage() {
  const { data: me } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
        Perfil
      </h1>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <p className="font-semibold text-foreground">{me?.name}</p>
        <p className="text-sm text-muted-foreground">
          {me?.role === 'Staff' ? 'Equipe' : 'Aluno'}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Tela em construção — chega numa próxima branch.
      </p>

      <Button
        variant="outline"
        className="mt-2 h-12 rounded-xl border-[1.5px] border-primary text-[15px] font-semibold text-primary hover:bg-primary/5 hover:text-primary"
        onClick={handleLogout}
        disabled={logout.isPending}
      >
        <LogOutIcon className="size-4" />
        Sair da conta
      </Button>
    </div>
  )
}
