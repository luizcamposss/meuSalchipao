import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
})
export type LoginValues = z.infer<typeof loginSchema>
