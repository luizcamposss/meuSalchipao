/**
 * Formatação pt-BR.
 *
 * O backend manda instantes em UTC. As **datas do evento** (abertura, fechamento,
 * retirada) representam dia/hora no fuso do Brasil, então são renderizadas fixas
 * em America/Sao_Paulo — assim o aluno vê a data certa independente do fuso do
 * aparelho.
 */

const TZ = 'America/Sao_Paulo'

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: TZ,
})

const timeFmt = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TZ,
})

const dayMonthFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: TZ,
})

const longDateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  timeZone: TZ,
})

const monthShortFmt = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: TZ,
})

const weekdayFmt = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  timeZone: TZ,
})

const dayFmt = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  timeZone: TZ,
})

// YYYY-MM-DD no fuso do Brasil — usado pra contar dias de calendário
const isoDayFmt = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: TZ,
})

const toDate = (v: string | Date) => (typeof v === 'string' ? new Date(v) : v)

export const money = (value: number) => brl.format(value)

export const formatDateTime = (value: string | Date) =>
  dateTimeFmt.format(toDate(value))

export const formatTime = (value: string | Date) => timeFmt.format(toDate(value))

/** "14/09" */
export const dayMonth = (value: string | Date) => dayMonthFmt.format(toDate(value))

/** "17 de setembro" */
export const longDate = (value: string | Date) => longDateFmt.format(toDate(value))

/** "SET" */
export const monthShort = (value: string | Date) =>
  monthShortFmt.format(toDate(value)).replace('.', '').toUpperCase()

/** "quarta-feira" -> "QUARTA" */
export const weekdayShort = (value: string | Date) =>
  weekdayFmt.format(toDate(value)).split('-')[0].toUpperCase()

/** "17" */
export const dayOfMonth = (value: string | Date) => dayFmt.format(toDate(value))

/**
 * Dias de calendário (fuso BR) de `from` até `to`.
 * 0 = mesmo dia, 1 = amanhã, -1 = ontem.
 */
export function calendarDaysBetween(
  from: string | Date,
  to: string | Date,
): number {
  const a = isoDayFmt.format(toDate(from))
  const b = isoDayFmt.format(toDate(to))
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

/** "hoje" | "amanhã" | "em 3 dias" | null (já passou) */
export function relativeDay(from: string | Date, to: string | Date): string | null {
  const d = calendarDaysBetween(from, to)
  if (d < 0) return null
  if (d === 0) return 'hoje'
  if (d === 1) return 'amanhã'
  return `em ${d} dias`
}
