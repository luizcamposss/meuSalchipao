import { QueryClientProvider } from '@tanstack/react-query'
import { domAnimation, LazyMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { queryClient } from '@/lib/queryClient'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* LazyMotion + domAnimation: carrega só o necessário p/ animações de
          opacidade/transform (a barra de abas). O bundle de `drag` (domMax)
          entra no F4, quando o slide-to-redeem precisar. */}
      <LazyMotion features={domAnimation} strict>
        <BrowserRouter>{children}</BrowserRouter>
      </LazyMotion>
    </QueryClientProvider>
  )
}
