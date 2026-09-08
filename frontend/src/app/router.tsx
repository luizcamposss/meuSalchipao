import { Route, Routes } from 'react-router-dom'

import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

import { AppLayout } from './AppLayout'
import { PublicOnly, RequireAuth } from './RequireAuth'

export function AppRoutes() {
  return (
    <Routes>
      {/* pública — logado é mandado pra Home */}
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        {/* /register: próxima branch (feat/frontend-register) */}
        <Route
          path="/register"
          element={
            <div className="grid min-h-dvh place-items-center px-6 text-center text-sm text-muted-foreground">
              Cadastro — próxima branch.
            </div>
          }
        />
      </Route>

      {/* miolo logado */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
