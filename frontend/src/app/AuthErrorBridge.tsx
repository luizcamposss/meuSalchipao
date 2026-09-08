import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { authKeys } from '@/features/auth/hooks'
import { setUnauthorizedHandler } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

/**
 * Liga o `api.ts` (que não conhece o router) ao React Router.
 * Quando um refresh falha, o cliente HTTP chama este handler:
 * limpa a sessão do cache e manda pro /login.
 */
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
