import { Navigate, Route, Routes } from 'react-router-dom'

import { useMe } from '@/features/auth/hooks'
import { CartPage } from '@/pages/CartPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OrderPage } from '@/pages/OrderPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SacPage } from '@/pages/SacPage'
import { StaffPage } from '@/pages/staff/StaffPage'
import { StaffTicketPage } from '@/pages/staff/StaffTicketPage'
import { TicketPage } from '@/pages/TicketPage'

import { AppLayout } from './AppLayout'
import { PublicOnly, RequireAuth, RequireStaff } from './RequireAuth'
import { StaffLayout } from './StaffLayout'

export function AppRoutes() {
  const { data: me } = useMe()
  const isStaff = me?.role === 'Staff'

  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<RequireStaff />}>
          <Route element={<StaffLayout />}>
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/staff/sac/:ticketId" element={<StaffTicketPage />} />
          </Route>
        </Route>

        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={isStaff ? <Navigate to="/staff" replace /> : <HomePage />}
          />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/pedidos/:orderId" element={<OrderPage />} />
          <Route path="/pedidos/:orderId/ticket" element={<TicketPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/sac" element={<SacPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
