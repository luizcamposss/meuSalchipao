import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { PasswordInput } from '@/components/PasswordInput'
import { TricolorBar } from '@/components/TricolorBar'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLogin, useRegister } from '@/features/auth/hooks'
import {
  type RegisterValues,
  registerSchema,
  shiftOptions,
} from '@/features/auth/schemas'
import { ApiError } from '@/lib/api'
import { applyApiErrorToForm } from '@/lib/form'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useRegister()
  const login = useLogin()

  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', enrollment: '', password: '' },
  })

  const pending = register.isPending || login.isPending

  async function onSubmit(values: RegisterValues) {
    setFormError(null)
    try {
      await register.mutateAsync(values)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const msg = err.message.toLowerCase()
        if (msg.includes('registration') || msg.includes('matríc')) {
          form.setError('enrollment', { message: 'Matrícula já cadastrada.' })
        } else {
          form.setError('email', { message: 'E-mail já cadastrado.' })
        }
      } else if (err instanceof ApiError && err.status === 429) {
        setFormError('Muitas tentativas. Aguarde um minuto e tente de novo.')
      } else if (!applyApiErrorToForm(err, form.setError)) {
        setFormError('Não foi possível criar a conta. Tente novamente.')
      }
      return
    }

    try {
      await login.mutateAsync({
        email: values.email,
        password: values.password,
      })
      navigate('/', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TricolorBar />

      <div className="mx-auto w-full max-w-sm px-6 pb-12 pt-8">
        <Logo className="mx-auto mb-6 w-52" />

        <h1 className="text-[1.7rem] font-extrabold leading-[1.15] tracking-tight text-foreground">
          Crie sua conta
        </h1>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-7 grid gap-5"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      placeholder="Como você se chama?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="enrollment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matrícula</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="1234567890"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shift"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shiftOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      autoComplete="new-password"
                      placeholder="Crie uma senha"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Use pelo menos 8 caracteres.
                  </FormDescription>
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
              disabled={pending}
            >
              {pending ? 'Criando…' : 'Criar minha conta'}
            </Button>
          </form>
        </Form>

        <Button
          asChild
          variant="outline"
          className="mt-3 h-12 w-full rounded-xl border-[1.5px] border-primary bg-card text-[15px] font-semibold text-primary transition hover:bg-primary/5 hover:text-primary active:scale-[0.99]"
        >
          <Link to="/login">Entrar na minha conta</Link>
        </Button>
      </div>
    </div>
  )
}
