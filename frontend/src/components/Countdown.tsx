import * as React from 'react'

type Props = {
  to: string
  onExpire?: () => void
  className?: string
}

function remainingMs(to: string) {
  return Math.max(0, new Date(to).getTime() - Date.now())
}

export function Countdown({ to, onExpire, className }: Props) {
  const [ms, setMs] = React.useState(() => remainingMs(to))
  const [prevTo, setPrevTo] = React.useState(to)
  const firedRef = React.useRef(false)

  if (to !== prevTo) {
    setPrevTo(to)
    setMs(remainingMs(to))
  }

  React.useEffect(() => {
    firedRef.current = false
    const id = setInterval(() => {
      const next = remainingMs(to)
      setMs(next)
      if (next === 0 && !firedRef.current) {
        firedRef.current = true
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [to, onExpire])

  const total = Math.round(ms / 1000)
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')

  return (
    <span className={className}>
      {mm}:{ss}
    </span>
  )
}
