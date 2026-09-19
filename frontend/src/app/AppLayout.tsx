import { m } from 'motion/react'
import { Outlet, useLocation } from 'react-router-dom'

import { BottomNav } from '@/components/BottomNav'
import { TricolorBar } from '@/components/TricolorBar'

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <TricolorBar />

      <main className="flex flex-1 flex-col overflow-x-hidden">
        <m.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-1 flex-col px-5 py-6"
        >
          <Outlet />
        </m.div>
      </main>

      <BottomNav />
    </div>
  )
}
