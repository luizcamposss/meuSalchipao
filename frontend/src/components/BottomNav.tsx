import { HouseIcon, ReceiptTextIcon, ShoppingBagIcon, UserIcon } from 'lucide-react'
import { m, useSpring, useTransform } from 'motion/react'
import {
  type ComponentType,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'

type Tab = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

const tabs: Tab[] = [
  { to: '/', label: 'Início', icon: HouseIcon, end: true },
  { to: '/carrinho', label: 'Carrinho', icon: ShoppingBagIcon },
  { to: '/pedidos', label: 'Pedidos', icon: ReceiptTextIcon },
  { to: '/perfil', label: 'Perfil', icon: UserIcon },
]

const INDICATOR_W = 28

export function BottomNav() {
  const ref = useRef<HTMLElement>(null)
  const [width, setWidth] = useState(375)
  const { pathname } = useLocation()

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) =>
      t.end ? pathname === t.to : pathname.startsWith(t.to),
    ),
  )

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWidth(el.getBoundingClientRect().width)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const seg = width / tabs.length
  const target = activeIndex * seg + seg / 2
  const x = useSpring(target, { stiffness: 320, damping: 30 })
  useEffect(() => {
    x.set(target)
  }, [target, x])
  const indicatorX = useTransform(x, (v) => v - INDICATOR_W / 2)

  return (
    <nav
      ref={ref}
      className="sticky bottom-0 z-20 border-t border-border bg-card"
    >
      <m.div
        aria-hidden
        className="absolute left-0 top-0 h-[3px] rounded-full bg-primary"
        style={{ width: INDICATOR_W, x: indicatorX }}
      />

      <ul className="flex pb-[calc(0.375rem+env(safe-area-inset-bottom))] pt-2.5">
        {tabs.map((t, i) => {
          const active = i === activeIndex
          const Icon = t.icon
          return (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                end={t.end}
                className="flex flex-col items-center gap-1 py-1 outline-none transition-transform active:scale-95"
              >
                <Icon
                  className={cn(
                    'size-6 transition-colors',
                    active ? 'text-primary' : 'text-primary/45',
                  )}
                />
                <span
                  className={cn(
                    'text-[0.6875rem] transition-colors',
                    active
                      ? 'font-semibold text-primary'
                      : 'font-medium text-primary/45',
                  )}
                >
                  {t.label}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
