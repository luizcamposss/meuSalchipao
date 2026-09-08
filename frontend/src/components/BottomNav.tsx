import { HouseIcon, ReceiptTextIcon, ShoppingBagIcon, UserIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'

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

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-border bg-card">
      <ul className="flex items-stretch justify-around px-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <Icon className="size-[1.375rem]" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
