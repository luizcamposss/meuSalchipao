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

export interface LoginResponse {
  id: string
  name: string
  email: string
  role: Role
  shift: Shift
}

export interface Me {
  id: string
  name: string
  email: string
  enrollment: string
  shift: Shift
  role: Role
}

export interface StaffResetPasswordRequest {
  email: string
  newPassword: string
}

export interface StaffResetPasswordResponse {
  id: string
  name: string
  email: string
  enrollment: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  available: boolean
}

export interface SaleWindowResponse {
  id: string
  label: string
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
  saleWindows: SaleWindowResponse[]
}

export interface UpdateEventRequest {
  salesOpenAt: string
  salesCloseAt: string
  redemptionOpensAt: string
  forcedPhase: ForcedPhase
}

export interface CreateSaleWindowRequest {
  label: string
  opensAt: string
  closesAt: string
  cap: number
}

export interface UpdateSaleWindowRequest {
  label: string
  opensAt: string
  closesAt: string
  cap: number
}

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

export interface DailySales {
  day: string
  salchipos: number
  revenue: number
}

export interface ShiftSales {
  shift: Shift
  salchipos: number
  revenue: number
}

export interface OrderStats {
  salchiposSold: number
  revenue: number
  ticketsToRedeem: number
  ticketsRedeemed: number
  ticketsGenerated: number
  byDay: DailySales[]
  byShift: ShiftSales[]
}

export interface PaymentResponse {
  paymentId: string
  status: PaymentStatus
  pixCode: string | null
  pixQrCodeBase64: string | null
  expiresAt: string
  amount: number
}

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
  userName?: string | null
  userEmail?: string | null
  userEnrollment?: string | null
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}
