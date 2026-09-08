import { ChevronRightIcon, Loader2Icon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

type Props = {
  label: string
  onConfirm: () => void
  disabled?: boolean
  loading?: boolean
}

const HANDLE = 48 // px
const PAD = 4 // folga dentro do trilho
const THRESHOLD = 0.9 // fração do curso para confirmar

/** Arrastar o botão até o fim para confirmar. Sem lib — pointer events. */
export function SlideToConfirm({ label, onConfirm, disabled, loading }: Props) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const startRef = React.useRef(0)
  const [x, setX] = React.useState(0)
  const [maxX, setMaxX] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)

  const locked = disabled || loading

  React.useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () =>
      setMaxX(Math.max(0, el.clientWidth - HANDLE - PAD * 2))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    if (locked) return
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = e.clientX - x
    setDragging(true)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return
    setX(Math.min(maxX, Math.max(0, e.clientX - startRef.current)))
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragging) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
    if (maxX > 0 && x >= maxX * THRESHOLD) {
      setX(maxX)
      onConfirm()
    } else {
      setX(0)
    }
  }

  const progress = maxX > 0 ? x / maxX : 0

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative h-14 w-full select-none overflow-hidden rounded-full bg-secondary',
        locked && 'opacity-60',
      )}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary/15"
        style={{ width: x + HANDLE + PAD }}
      />

      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary"
        style={{ opacity: 1 - progress }}
      >
        {label}
      </span>

      <button
        type="button"
        aria-label={label}
        disabled={locked}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          'absolute top-1/2 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-md',
          !dragging && 'transition-transform',
          !locked && 'cursor-grab active:cursor-grabbing',
        )}
        style={{ left: PAD, transform: `translate(${x}px, -50%)` }}
      >
        {loading ? (
          <Loader2Icon className="size-5 animate-spin" />
        ) : (
          <ChevronRightIcon className="size-5" />
        )}
      </button>
    </div>
  )
}
