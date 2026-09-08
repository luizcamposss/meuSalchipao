import { useMe } from '@/features/auth/hooks'

/** Stub. As próximas branches trazem a Home dirigida pela fase do evento. */
export function HomePage() {
  const { data: me } = useMe()

  return (
    <div className="grid gap-2">
      <h2 className="text-xl font-semibold">Olá, {me?.name}</h2>
      <p className="text-sm text-muted-foreground">
        Login funcionando. As telas seguintes entram uma por branch.
      </p>
    </div>
  )
}
