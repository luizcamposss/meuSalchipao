import { Route, Routes } from 'react-router-dom'

import { CartPage } from '@/pages/CartPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RegisterPage } from '@/pages/RegisterPage'

import { AppLayout } from './AppLayout'
import { PublicOnly, RequireAuth } from './RequireAuth'

export function AppRoutes() {
  return (
    <Routes>
      {/* públicas — logado é mandado pra Home */}
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* miolo logado */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
