/** Faixa tricolor da bandeira do RS: vermelho, verde, amarelo. */
export function TricolorBar() {
  return (
    <div className="flex h-1 w-full shrink-0" aria-hidden>
      <div className="flex-1 bg-flag-red" />
      <div className="flex-1 bg-flag-green" />
      <div className="flex-1 bg-flag-yellow" />
    </div>
  )
}
