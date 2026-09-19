import { ChevronLeftIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { TicketDetail } from './TicketDetail'

export function StaffTicketPage() {
  const { ticketId = '' } = useParams()

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/staff"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeftIcon className="size-4" />
        Voltar ao painel
      </Link>
      <div className="max-w-2xl">
        <TicketDetail ticketId={ticketId} />
      </div>
    </div>
  )
}
