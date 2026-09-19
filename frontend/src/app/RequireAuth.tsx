import { Loader2Icon } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useMe } from '@/features/auth/hooks'

function FullScreen() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export function RequireAuth() {
  const { data: me, isLoading } = useMe()
  const location = useLocation()

  if (isLoading) return <FullScreen />
  if (!me) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function PublicOnly() {
  const { data: me, isLoading } = useMe()

  if (isLoading) return <FullScreen />
  if (me) return <Navigate to="/" replace />
  return <Outlet />
}

export function RequireStaff() {
  const { data: me, isLoading } = useMe()

  if (isLoading) return <FullScreen />
  if (!me) return <Navigate to="/login" replace />
  if (me.role !== 'Staff') return <Navigate to="/" replace />
  return <Outlet />
}
