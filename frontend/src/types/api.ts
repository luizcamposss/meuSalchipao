/**
 * Tipos que espelham os DTOs do backend (ASP.NET Core).
 * Fonte: README.md (raiz) + os records em backend/Modules/ * /Contracts.
 *
 * Convenções do backend:
 *  - JSON em camelCase (padrão do ASP.NET).
 *  - enums serializados como STRING no nome do valor ("Student", "Paid", ...).
 *  - datas em ISO 8601 UTC (string). Converter para Date só no render.
 */

// ---- enums (string unions) -----------------------------------------------

export type Role = 'Undefined' | 'Student' | 'Staff'
export type Shift = 'Undefined' | 'Morning' | 'Afternoon' | 'Evening'

export type OrderStatus = 'AwaitingPayment' | 'Paid' | 'Redeemed' | 'Cancelled'

export type PaymentStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Expired'
  | 'Refunded'

export type ForcedPhase = 'Auto' | 'SalesOnly' | 'RedemptionOnly' | 'Closed'

export type EventPhaseName =
  | 'BeforeSales'
  | 'SalesOpen'
  | 'RedemptionOnly'
  | 'SalesClosed'

export type SacTicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed'
export type SacTicketPriority = 'Low' | 'Normal' | 'High'

// ---- auth --------------------------------------------------------------

export interface RegisterRequest {
  name: string
  email: string
  enrollment: string
  shift: Shift
  password: string
}

export interface RegisterResponse {
  id: string
  name: string
  email: string
  enrollment: string
  shift: Shift
  role: Role
  active: boolean
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

/** corpo de POST /auth/login e /auth/refresh */
export interface LoginResponse {
  id: string
  name: string
  email: string
  role: Role
  shift: Shift
}

/** corpo de GET /auth/me */
export interface Me {
  id: string
  name: string
  email: string
  enrollment: string
  shift: Shift
  role: Role
}

// ---- catalog ---------------------------------------------------------

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  available: boolean
}

// ---- event ---------------------------------------------------------

export interface SaleWindowSnapshot {
  open: boolean
  opensAt: string
  closesAt: string
  cap: number
  remaining: number
}

export interface EventPhaseSnapshot {
  salesOpen: boolean
  redemptionOpen: boolean
  phase: EventPhaseName
  forcedPhase: ForcedPhase
  salesOpenAt: string
  salesCloseAt: string
  redemptionOpensAt: string
  serverTime: string
  morningSale: SaleWindowSnapshot
  afternoonSale: SaleWindowSnapshot
}

export interface UpdateEventRequest {
  salesOpenAt: string
  salesCloseAt: string
  redemptionOpensAt: string
  forcedPhase: ForcedPhase
  morningSaleOpensAt: string
  morningSaleClosesAt: string
  morningSaleCap: number
  afternoonSaleOpensAt: string
  afternoonSaleClosesAt: string
  afternoonSaleCap: number
}

// ---- orders --------------------------------------------------------

export interface CreateOrderItem {
  productId: string
  quantity: number
}

export interface CreateOrderRequest {
  items: CreateOrderItem[]
}

export interface OrderItemResponse {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
}

export interface OrderResponse {
  id: string
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
  items: OrderItemResponse[]
}

export interface TicketResponse {
  orderId: string
  status: OrderStatus
  total: number
  createdAt: string
  redeemedAt: string | null
  pickupNumber: number | null
  qrValue: string
  items: OrderItemResponse[]
}

/** uma barra do gráfico "salchipões por dia" (dia em horário de Brasília) */
export interface DailySales {
  /** "2026-09-08" */
  day: string
  salchipos: number
  revenue: number
}

/** GET /orders/stats — números do evento para o painel da equipe (Staff). */
export interface OrderStats {
  /** salchipões vendidos (soma das quantidades de pedidos pagos) */
  salchiposSold: number
  /** total em reais dos pedidos pagos */
  revenue: number
  /** tickets pagos ainda não resgatados */
  ticketsToRedeem: number
  /** tickets já resgatados no balcão */
  ticketsRedeemed: number
  /** tickets gerados ao todo (pagos + resgatados) */
  ticketsGenerated: number
  /** vendas por dia, em ordem crescente */
  byDay: DailySales[]
}

// ---- payments ----------------------------------------------------

export interface PaymentResponse {
  paymentId: string
  status: PaymentStatus
  pixCode: string | null
  pixQrCodeBase64: string | null
  expiresAt: string
  amount: number
}

// ---- sac -------------------------------------------------------

export interface CreateTicketRequest {
  subject: string
  description: string
  orderId?: string | null
}

export interface AddMessageRequest {
  message: string
}

export interface UpdateTicketRequest {
  status?: SacTicketStatus | null
  priority?: SacTicketPriority | null
}

export interface SacMessageResponse {
  id: string
  senderId: string
  fromStaff: boolean
  message: string
  createdAt: string
}

export interface SacTicketResponse {
  id: string
  userId: string
  orderId: string | null
  subject: string
  description: string
  status: SacTicketStatus
  priority: SacTicketPriority
  createdAt: string
  updatedAt: string
  messages: SacMessageResponse[]
  /** dados do aluno — vêm no GET por id e na fila (Staff) */
  userName?: string | null
  userEmail?: string | null
  userEnrollment?: string | null
}

// ---- erro (RFC 7807 ProblemDetails) --------------------------

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}
