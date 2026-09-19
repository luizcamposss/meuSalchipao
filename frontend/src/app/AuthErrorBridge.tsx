import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { authKeys } from '@/features/auth/hooks'
import { setUnauthorizedHandler } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

export function AuthErrorBridge() {
  const navigate = useNavigate()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(authKeys.me, null)
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate])

  return null
}
