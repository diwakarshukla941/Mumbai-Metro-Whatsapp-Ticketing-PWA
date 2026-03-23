import { startTransition, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { confirmPayment, fetchBooking } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { BookingDetail } from '../types'
import { formatCurrency, formatJourneyType, formatTravelerLabel } from '../utils'

const paymentLabels = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net Banking',
} as const

export function PendingPage() {
  const navigate = useNavigate()
  const { bookingId } = useParams()
  const [searchParams] = useSearchParams()
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<'redirecting' | 'issuing'>('redirecting')
  const selectedMethod = useMemo(() => {
    const requestedMethod = searchParams.get('method')
    if (requestedMethod === 'card' || requestedMethod === 'netbanking') {
      return requestedMethod
    }

    return 'upi'
  }, [searchParams])

  useEffect(() => {
    if (!bookingId) {
      return
    }

    let cancelled = false

    fetchBooking(bookingId)
      .then((result) => {
        if (cancelled) {
          return
        }

        if (result.ticket) {
          const existingTicket = result.ticket
          startTransition(() => {
            navigate(`/ticket/${existingTicket.id}`, { replace: true })
          })
          return
        }

        setDetail(result)
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
  }, [bookingId, navigate])

  const paymentId = searchParams.get('paymentId') ?? detail?.payment?.id ?? null
  const methodLabel = paymentLabels[selectedMethod]

  useEffect(() => {
    if (!detail || !paymentId) {
      return
    }

    let cancelled = false

    const timer = window.setTimeout(async () => {
      if (cancelled) {
        return
      }

      setStage('issuing')

      try {
        const result = await confirmPayment(paymentId, selectedMethod)
        if (!cancelled) {
          startTransition(() => {
            navigate(`/ticket/${result.ticket.id}`, { replace: true })
          })
        }
      } catch (requestError) {
        if (cancelled) {
          return
        }

        const message = (requestError as Error).message
        setError(message)
        startTransition(() => {
          const nextSearchParams = new URLSearchParams({ reason: message })
          navigate(`/failed/${detail.booking.id}?${nextSearchParams.toString()}`, { replace: true })
        })
      }
    }, 1200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [detail, navigate, paymentId, selectedMethod])

  if (loading) {
    return <LoadingScreen label="Opening secure checkout..." />
  }

  if (!detail) {
    return <StateMessage title="Pending status unavailable" body={error ?? 'Booking could not be loaded.'} />
  }

  if (paymentId) {
    const heading =
      stage === 'redirecting' ? 'Redirecting to secure checkout...' : 'Payment received. Issuing ticket...'
    const body =
      stage === 'redirecting'
        ? `Do not close this page. Your ${methodLabel} checkout is being opened for the selected journey.`
        : `Please wait while the ${methodLabel} payment is confirmed and the QR ticket is generated.`

    return (
      <section className="surface-card page-card premium-page">
        <div className="gateway-status-card">
          <div className="loader-mark gateway-loader" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="eyebrow">{stage === 'redirecting' ? 'Redirecting' : 'Authorizing payment'}</p>
          <h2>{heading}</h2>
          <p>{body}</p>
        </div>

        <div className="summary-grid">
          <article className="info-card emphasis-card">
            <p className="eyebrow">Amount</p>
            <strong>{formatCurrency(detail.booking.fare.totalFare)}</strong>
            <p>{detail.booking.fare.routeLabel}</p>
          </article>

          <article className="info-card">
            <p className="eyebrow">Checkout details</p>
            <ul className="info-list">
              <li>Method: {methodLabel}</li>
              <li>Journey: {formatJourneyType(detail.booking.journeyType)}</li>
              <li>Passengers: {formatTravelerLabel(detail.booking.quantity)}</li>
            </ul>
          </article>
        </div>

        <p className="status-note">Keep this tab open until the ticket page loads.</p>
      </section>
    )
  }

  return (
    <section className="surface-card page-card premium-page">
      <div className="section-intro">
        <p className="eyebrow">Step 3</p>
        <h2>Payment pending</h2>
        <p>
          The checkout handoff has not completed yet. Retry the payment or return to booking if the passenger
          needs a new trip setup.
        </p>
      </div>

      <div className="summary-grid">
        <article className="info-card emphasis-card">
          <p className="eyebrow">Pending amount</p>
          <strong>{formatCurrency(detail.booking.fare.totalFare)}</strong>
          <p>
            {detail.origin.name} to {detail.destination.name}
          </p>
        </article>
      </div>

      <div className="action-row dual-actions">
        <Link className="secondary-button premium-secondary-button" to={`/payment/${detail.booking.id}`}>
          Retry payment
        </Link>
        <Link className="primary-button premium-primary-button" to="/">
          Start over
        </Link>
      </div>
    </section>
  )
}
