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
    <section className="screen-card ticket-screen">
      <div className="confetti-cloud" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="screen-copy">
        <p className="screen-kicker">Payment successful</p>
        <h1>Ticket party unlocked.</h1>
        <p className="screen-text">
          Your QR is live. Scan it to open the ticket details page with your journey info.
        </p>
      </div>

      <div className="ticket-shell">
        <div className="ticket-topline">
          <span>{detail.ticket.ticketNumber}</span>
          <span>Paid</span>
        </div>

        <div className="ticket-route">
          <strong>{detail.origin.name}</strong>
          <div className="route-line" />
          <strong>{detail.destination.name}</strong>
        </div>

        <div className="qr-box">
          <img src={detail.ticket.qrCodeDataUrl} alt="Mumbai Metro One ticket QR" />
        </div>

        <dl className="detail-grid">
          <div>
            <dt>Journey</dt>
            <dd>{formatJourneyType(detail.ticket.journeyType)}</dd>
          </div>
          <div>
            <dt>People</dt>
            <dd>{detail.ticket.quantity}</dd>
          </div>
          <div>
            <dt>Fare</dt>
            <dd>{formatCurrency(detail.ticket.amount)}</dd>
          </div>
          <div>
            <dt>Txn</dt>
            <dd>{detail.payment.transactionReference}</dd>
          </div>
        </dl>
      </div>

      <div className="screen-actions">
        <a className="secondary-button" href={scanHref} target="_blank" rel="noreferrer">
          Open scan result
        </a>
        <Link className="secondary-button" to="/">
          Book again
        </Link>
      </div>
    </section>
  )
}
