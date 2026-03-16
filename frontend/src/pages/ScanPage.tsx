import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchTicket } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { TicketDetail } from '../types'
import { formatCurrency, formatJourneyType } from '../utils'

export function ScanPage() {
  const { ticketId } = useParams()
  const [detail, setDetail] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ticketId) {
      return
    }

    let cancelled = false

    fetchTicket(ticketId)
      .then((result) => {
        if (!cancelled) {
          setDetail(result)
        }
      })
      .catch((requestError: Error) => {
        if (!cancelled) {
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [ticketId])

  if (loading) {
    return <LoadingScreen label="Opening scanned ticket..." />
  }

  if (!detail) {
    return <StateMessage title="Scanned ticket unavailable" body={error ?? 'Ticket could not be loaded.'} />
  }

  return (
    <section className="screen-card scan-screen">
      <div className="screen-copy">
        <p className="screen-kicker">Scanned ticket</p>
        <h1>{detail.ticket.ticketNumber}</h1>
        <p className="screen-text">This is the live ticket data revealed after scanning the QR code.</p>
      </div>

      <div className="route-card">
        <span>{detail.origin.name}</span>
        <div className="route-line" />
        <span>{detail.destination.name}</span>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Booking</dt>
          <dd>{detail.booking.id.slice(0, 8).toUpperCase()}</dd>
        </div>
        <div>
          <dt>Journey</dt>
          <dd>{formatJourneyType(detail.ticket.journeyType)}</dd>
        </div>
        <div>
          <dt>People</dt>
          <dd>{detail.ticket.quantity}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>{formatCurrency(detail.ticket.amount)}</dd>
        </div>
        <div>
          <dt>Travel date</dt>
          <dd>{new Date(detail.ticket.travelDate).toLocaleDateString('en-IN')}</dd>
        </div>
        <div>
          <dt>Issued</dt>
          <dd>{new Date(detail.ticket.issuedAt).toLocaleString('en-IN')}</dd>
        </div>
        <div>
          <dt>Payment ref</dt>
          <dd>{detail.payment.transactionReference ?? 'Pending'}</dd>
        </div>
      </dl>
    </section>
  )
}
