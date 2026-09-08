import { api } from '@/lib/api'
import type { EventPhaseSnapshot, UpdateEventRequest } from '@/types/api'

export const eventApi = {
  get: (signal?: AbortSignal) =>
    api.get<EventPhaseSnapshot>('/event', { signal }),

  update: (body: UpdateEventRequest) =>
    api.put<EventPhaseSnapshot>('/event', body),
}
