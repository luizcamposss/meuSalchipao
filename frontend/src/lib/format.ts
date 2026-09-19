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

const isoDayFmt = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: TZ,
})

const toDate = (v: string | Date) => {
  if (typeof v !== 'string') return v
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(v)
  return new Date(v.includes('T') && !hasTz ? `${v}Z` : v)
}

export const money = (value: number) => brl.format(value)

export const orderCode = (id: string) =>
  id.replace(/-/g, '').slice(0, 8).toUpperCase()

export const formatDateTime = (value: string | Date) =>
  dateTimeFmt.format(toDate(value))

export const formatTime = (value: string | Date) => timeFmt.format(toDate(value))

export const dayMonth = (value: string | Date) => dayMonthFmt.format(toDate(value))

export const longDate = (value: string | Date) => longDateFmt.format(toDate(value))

export const monthShort = (value: string | Date) =>
  monthShortFmt.format(toDate(value)).replace('.', '').toUpperCase()

export const weekdayShort = (value: string | Date) =>
  weekdayFmt.format(toDate(value)).split('-')[0].toUpperCase()

export const dayOfMonth = (value: string | Date) => dayFmt.format(toDate(value))

export function calendarDaysBetween(
  from: string | Date,
  to: string | Date,
): number {
  const a = isoDayFmt.format(toDate(from))
  const b = isoDayFmt.format(toDate(to))
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

export function toInputLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(toDate(iso))
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`
}

export function fromInputLocal(local: string): string {
  return new Date(`${local}:00-03:00`).toISOString()
}

export function relativeDay(from: string | Date, to: string | Date): string | null {
  const d = calendarDaysBetween(from, to)
  if (d < 0) return null
  if (d === 0) return 'hoje'
  if (d === 1) return 'amanhã'
  return `em ${d} dias`
}
