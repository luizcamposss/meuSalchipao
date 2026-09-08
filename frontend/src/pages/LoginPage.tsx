import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { PasswordInput } from '@/components/PasswordInput'
import { TricolorBar } from '@/components/TricolorBar'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useLogin } from '@/features/auth/hooks'
import { type LoginValues, loginSchema } from '@/features/auth/schemas'
import { ApiError } from '@/lib/api'
import { applyApiErrorToForm } from '@/lib/form'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()

  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    try {
      const user = await login.mutateAsync(values)
      navigate(user.role === 'Staff' ? '/staff' : from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        form.setError('password', { message: 'E-mail ou senha incorretos.' })
      } else if (err instanceof ApiError && err.status === 429) {
        setFormError('Muitas tentativas. Aguarde um minuto e tente de novo.')
      } else if (!applyApiErrorToForm(err, form.setError)) {
        setFormError('Não foi possível entrar. Tente novamente.')
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TricolorBar />

      <div className="flex flex-1 flex-col justify-center px-6 py-10">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mx-auto mb-6 w-60" />

          <h1 className="text-[1.7rem] font-extrabold leading-[1.15] tracking-tight text-foreground">
            Bah, que bom te ver!
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Entre e peça seu favorito, do seu jeito.
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-8 grid gap-5"
              noValidate
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        autoFocus
                        placeholder="voce@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="current-password"
                        placeholder="Digite sua senha"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {formError ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  {formError}
                </p>
              ) : null}

              <Button
                type="submit"
                className="mt-3 h-12 w-full rounded-xl text-[15px] font-semibold shadow-sm shadow-primary/25 transition active:scale-[0.99]"
                disabled={login.isPending}
              >
                {login.isPending ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          </Form>

          <Button
            asChild
            variant="outline"
            className="mt-3 h-12 w-full rounded-xl border-[1.5px] border-primary bg-card text-[15px] font-semibold text-primary transition hover:bg-primary/5 hover:text-primary active:scale-[0.99]"
          >
            <Link to="/register">Criar conta</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
