import { api } from '@/lib/api'
import type { EventPhaseSnapshot } from '@/types/api'

export const eventApi = {
  get: (signal?: AbortSignal) =>
    api.get<EventPhaseSnapshot>('/event', { signal }),
}
