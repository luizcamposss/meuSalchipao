import type { SacTicketPriority, SacTicketStatus } from '@/types/api'

export const STATUS_LABEL: Record<SacTicketStatus, string> = {
  Open: 'Aberto',
  InProgress: 'Em andamento',
  Resolved: 'Resolvido',
  Closed: 'Fechado',
}

export const PRIORITY_LABEL: Record<SacTicketPriority, string> = {
  Low: 'Baixa',
  Normal: 'Normal',
  High: 'Alta',
}

export const STATUS_CLASS: Record<SacTicketStatus, string> = {
  Open: 'bg-flag-yellow/25 text-foreground',
  InProgress: 'bg-primary/10 text-primary',
  Resolved: 'bg-flag-green/20 text-flag-green',
  Closed: 'bg-secondary text-muted-foreground',
}
