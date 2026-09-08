import * as React from 'react'

/**
 * useState que sobrevive à navegação (e a um reload da aba) guardando o valor
 * em sessionStorage. Cai no `initial` se o storage estiver indisponível.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = React.useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw != null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  React.useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage bloqueado / cheio — ignora
    }
  }, [key, value])

  return [value, setValue]
}
