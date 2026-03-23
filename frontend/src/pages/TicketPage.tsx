import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchTicket } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { TicketDetail } from '../types'
import { formatCurrency, formatDateTimeLabel, formatJourneyType, getTicketWindowStatus } from '../utils'

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
  const ticketStatus = getTicketWindowStatus(detail.ticket.validFrom, detail.ticket.validUntil)
  const statusMeta = {
    valid: {
      label: 'Valid today',
      note: `Ready for gate scan until ${formatDateTimeLabel(detail.ticket.validUntil)}.`,
    },
    upcoming: {
      label: 'Upcoming',
      note: `This ticket activates at ${formatDateTimeLabel(detail.ticket.validFrom)}.`,
    },
    expired: {
      label: 'Expired',
      note: `This ticket expired at ${formatDateTimeLabel(detail.ticket.validUntil)}.`,
    },
  }[ticketStatus]

  return (
    <section className="surface-card page-card simple-page premium-page">
      <div className="page-heading">
        <span className="page-kicker">Step 4</span>
        <h2>Your ticket</h2>
        <p>Keep this QR ready for scanning at the gate and use the status banner for a fast validity check.</p>
      </div>

      <div className="ticket-card luxury-ticket">
        <div className="ticket-ribbon" aria-hidden="true" />
        <div className="ticket-topbar">
          <span>{detail.ticket.ticketNumber}</span>
          <span>{statusMeta.label}</span>
        </div>

        <div className={`validation-banner ticket-status-banner is-${ticketStatus}`}>
          <span>Status</span>
          <strong>{statusMeta.label}</strong>
          <span>{statusMeta.note}</span>
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

      <div className="info-grid">
        <article className="info-card emphasis-card">
          <p className="eyebrow">Validity window</p>
          <ul className="info-list">
            <li>From: {formatDateTimeLabel(detail.ticket.validFrom)}</li>
            <li>Until: {formatDateTimeLabel(detail.ticket.validUntil)}</li>
            <li>{detail.ticket.validityNote}</li>
          </ul>
        </article>

        <article className="info-card ticket-support-card">
          <p className="eyebrow">Need help?</p>
          <strong>WhatsApp assist</strong>
          <p>Open a prefilled support thread with the ticket number, route, and journey details.</p>
          <a
            className="secondary-button premium-secondary-button support-link-button"
            href={detail.ticket.whatsappAssistUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open WhatsApp help
          </a>
        </article>
      </div>

      <div className="action-row dual-actions">
        <a className="secondary-button premium-secondary-button" href={scanHref} target="_blank" rel="noreferrer">
          {ticketStatus === 'expired' ? 'View scan record' : 'Open scan page'}
        </a>
        <Link className="primary-button premium-primary-button" to="/">
          Book again
        </Link>
      </div>
    </section>
  )
}
