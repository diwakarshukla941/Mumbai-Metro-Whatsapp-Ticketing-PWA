import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchTicket } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { TicketDetail } from '../types'
import { formatCurrency, formatJourneyType } from '../utils'

export function TicketPage() {
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
    return <LoadingScreen label="Loading ticket..." />
  }

  if (!detail) {
    return <StateMessage title="Ticket unavailable" body={error ?? 'Ticket could not be loaded.'} />
  }

  const scanHref = detail.ticket.scanUrl || `/scan/${detail.ticket.id}`

  return (
    <section className="surface-card page-card simple-page premium-page">
      <div className="page-heading">
        <span className="page-kicker">Ticket ready</span>
        <h2>Your ticket</h2>
        <p>Keep this QR ready for scanning at the gate.</p>
      </div>

      <div className="ticket-card luxury-ticket">
        <div className="ticket-ribbon" aria-hidden="true" />
        <div className="ticket-topbar">
          <span>{detail.ticket.ticketNumber}</span>
          <span>Paid</span>
        </div>

        <div className="route-hero ticket-route-hero">
          <div className="route-station">
            <span className="field-label">From</span>
            <strong>{detail.origin.name}</strong>
          </div>
          <div className="route-connector" aria-hidden="true" />
          <div className="route-station">
            <span className="field-label">To</span>
            <strong>{detail.destination.name}</strong>
          </div>
        </div>

        <div className="ticket-grid">
          <div className="summary-card premium-summary-card">
            <div className="summary-row">
              <span>Journey type</span>
              <strong>{formatJourneyType(detail.ticket.journeyType)}</strong>
            </div>
            <div className="summary-row">
              <span>Persons</span>
              <strong>{detail.ticket.quantity}</strong>
            </div>
            <div className="summary-row">
              <span>Fare</span>
              <strong>{formatCurrency(detail.ticket.amount)}</strong>
            </div>
          </div>

          <div className="qr-panel premium-qr-panel">
            {detail.ticket.qrCodeDataUrl ? (
              <img src={detail.ticket.qrCodeDataUrl} alt="Mumbai Metro One ticket QR" />
            ) : (
              <div className="qr-fallback">QR unavailable</div>
            )}
          </div>
        </div>
      </div>

      <div className="action-row dual-actions">
        <a className="secondary-button premium-secondary-button" href={scanHref} target="_blank" rel="noreferrer">
          Open scan page
        </a>
        <Link className="primary-button premium-primary-button" to="/">
          Book again
        </Link>
      </div>
    </section>
  )
}
