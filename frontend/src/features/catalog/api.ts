import { api } from '@/lib/api'
import type { Product } from '@/types/api'

export const catalogApi = {
  list: (signal?: AbortSignal) =>
    api.get<Product[]>('/products', { signal }),
}
