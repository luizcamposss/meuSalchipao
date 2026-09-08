import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
})
export type LoginValues = z.infer<typeof loginSchema>

/** turnos oferecidos no cadastro (o backend tem Undefined=0, que não expomos) */
export const shiftOptions = [
  { value: 'Morning', label: 'Manhã' },
  { value: 'Afternoon', label: 'Tarde' },
  { value: 'Evening', label: 'Noite' },
] as const

const shiftValues = ['Morning', 'Afternoon', 'Evening'] as const

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Mínimo de 3 caracteres.')
    .max(100, 'Máximo de 100 caracteres.'),
  email: z.email('E-mail inválido.').max(191, 'Máximo de 191 caracteres.'),
  enrollment: z
    .string()
    .trim()
    .min(1, 'Informe a matrícula.')
    .max(10, 'Máximo de 10 caracteres.'),
  shift: z.enum(shiftValues, { error: 'Selecione o turno.' }),
  password: z
    .string()
    .min(8, 'Use pelo menos 8 caracteres.')
    .max(128, 'Máximo de 128 caracteres.'),
})
export type RegisterValues = z.infer<typeof registerSchema>
