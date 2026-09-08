import { AuthErrorBridge } from '@/app/AuthErrorBridge'
import { Providers } from '@/app/providers'
import { AppRoutes } from '@/app/router'

export default function App() {
  return (
    <Providers>
      <AuthErrorBridge />
      <AppRoutes />
    </Providers>
  )
}
