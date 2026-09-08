import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { ApiError } from './api'

/**
 * Joga os erros de validação do backend (ProblemDetails.errors, chaves
 * PascalCase tipo "Email") nos campos do formulário (RHF, "email").
 * Retorna true se aplicou algo — o caller decide se ainda mostra um erro geral.
 */
export function applyApiErrorToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError) || !error.fieldErrors) return false

  let applied = false
  for (const [key, messages] of Object.entries(error.fieldErrors)) {
    const field = (key.charAt(0).toLowerCase() + key.slice(1)) as Path<T>
    setError(field, { type: 'server', message: messages.join(' ') })
    applied = true
  }
  return applied
}
