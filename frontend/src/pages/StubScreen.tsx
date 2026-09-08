/** Tela placeholder para as abas que ainda não têm implementação. */
export function StubScreen({ title }: { title: string }) {
  return (
    <div className="grid gap-2">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">
        Tela em construção — chega numa próxima branch.
      </p>
    </div>
  )
}
