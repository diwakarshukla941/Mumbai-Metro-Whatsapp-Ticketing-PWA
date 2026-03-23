import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchTicket } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { TicketDetail } from '../types'
import {
  formatCurrency,
  formatDateLabel,
  formatDateTimeLabel,
  formatJourneyType,
  getTicketWindowStatus,
  formatTravelerLabel,
} from '../utils'

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
    return <LoadingScreen label="Opening gate validation view..." />
  }

  if (!detail) {
    return (
      <StateMessage title="Scanned ticket unavailable" body={error ?? 'Ticket could not be loaded.'} />
    )
  }

  const ticketStatus = getTicketWindowStatus(detail.ticket.validFrom, detail.ticket.validUntil)
  const statusMeta = {
    valid: {
      heading: 'Ticket status: valid.',
      detail: 'Ticket is currently inside the permitted travel window.',
      badge: 'Valid',
    },
    upcoming: {
      heading: 'Ticket status: not active yet.',
      detail: 'Do not allow entry before the validity window opens.',
      badge: 'Upcoming',
    },
    expired: {
      heading: 'Ticket status: expired.',
      detail: 'The validity window has ended and the ticket should not be accepted.',
      badge: 'Expired',
    },
  }[ticketStatus]

  return (
    <section className="surface-card page-card premium-page">
      <div className="section-intro">
        <p className="eyebrow">Gate validation</p>
        <h2>{statusMeta.heading}</h2>
        <p>{statusMeta.detail}</p>
      </div>

      <div className={`validation-banner ticket-status-banner is-${ticketStatus}`}>
        <strong>{statusMeta.badge}</strong>
        <span>{`${detail.origin.code} -> ${detail.destination.code}`}</span>
        <span>Checked {formatDateTimeLabel(new Date().toISOString())}</span>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Origin</dt>
          <dd>{detail.origin.name}</dd>
        </div>
        <div>
          <dt>Destination</dt>
          <dd>{detail.destination.name}</dd>
        </div>
        <div>
          <dt>Travel date</dt>
          <dd>{formatDateLabel(detail.ticket.travelDate)}</dd>
        </div>
        <div>
          <dt>Journey type</dt>
          <dd>{formatJourneyType(detail.ticket.journeyType)}</dd>
        </div>
        <div>
          <dt>Passengers</dt>
          <dd>{formatTravelerLabel(detail.ticket.quantity)}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>{formatCurrency(detail.ticket.amount)}</dd>
        </div>
        <div>
          <dt>Payment ref</dt>
          <dd>{detail.payment.transactionReference ?? 'Pending'}</dd>
        </div>
        <div>
          <dt>Validation token</dt>
          <dd>{detail.ticket.validationToken}</dd>
        </div>
      </dl>

      <div className="info-grid">
        <article className="info-card">
          <p className="eyebrow">Validity window</p>
          <ul className="info-list">
            <li>From: {formatDateTimeLabel(detail.ticket.validFrom)}</li>
            <li>Until: {formatDateTimeLabel(detail.ticket.validUntil)}</li>
            <li>{detail.ticket.validityNote}</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
