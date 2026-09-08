import { HeadphonesIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLogout, useMe } from '@/features/auth/hooks'
import { shiftOptions } from '@/features/auth/schemas'
import type { Shift } from '@/types/api'

function shiftLabel(shift: Shift) {
  return shiftOptions.find((o) => o.value === shift)?.label ?? '—'
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-dashed border-border py-3 first:border-t-0 first:pt-0">
      <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  )
}

export function ProfilePage() {
  const { data: me, isLoading } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Logo className="mx-auto w-44" />

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Perfil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confira e mantenha seus dados atualizados.
        </p>
      </div>

      <div className="rounded-3xl bg-card p-5 shadow-sm">
        {isLoading || !me ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/15 text-lg font-extrabold text-primary">
                {me.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-bold text-foreground">{me.name}</p>
                <p className="text-sm text-muted-foreground">
                  {me.role === 'Staff' ? 'Conta da equipe' : 'Conta de cliente'}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <Field label="Nome" value={me.name} />
              <Field label="E-mail" value={me.email} />
              <Field label="Matrícula" value={me.enrollment} />
              <Field label="Turno" value={shiftLabel(me.shift)} />
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-xl border-[1.5px] border-primary text-sm font-semibold text-primary hover:bg-primary/5 hover:text-primary"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                Sair da conta
              </Button>
              <Button
                asChild
                className="h-11 flex-1 rounded-xl text-sm font-semibold"
              >
                <Link to="/sac">
                  <HeadphonesIcon className="size-4" />
                  Falar com SAC
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
