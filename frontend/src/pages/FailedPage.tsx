import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchBooking } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { BookingDetail } from '../types'
import { formatCurrency } from '../utils'

export function FailedPage() {
  const { bookingId } = useParams()
  const [searchParams] = useSearchParams()
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookingId) {
      return
    }

    let cancelled = false

    fetchBooking(bookingId)
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
  }, [bookingId])

  if (loading) {
    return <LoadingScreen label="Loading payment failure state..." />
  }

  if (!detail) {
    return <StateMessage title="Failure state unavailable" body={error ?? 'Booking could not be loaded.'} />
  }

  const failureReason = searchParams.get('reason')

  return (
    <section className="surface-card page-card premium-page">
      <div className="section-intro">
        <div className="failure-icon" aria-hidden="true" />
        <p className="eyebrow">Step 3</p>
        <h2>Payment failed</h2>
        <p>
          No ticket has been issued for this booking. Retry the payment when ready. If money was deducted,
          it may return to the source account within 24 to 36 hours.
        </p>
      </div>

      <div className="summary-grid">
        <article className="info-card emphasis-card">
          <p className="eyebrow">Affected amount</p>
          <strong>{formatCurrency(detail.booking.fare.totalFare)}</strong>
          <p>{detail.booking.fare.routeLabel}</p>
        </article>

        <article className="info-card">
          <p className="eyebrow">What to do next</p>
          <ul className="info-list">
            <li>Retry the checkout from the payment step.</li>
            <li>Use the same passenger details if the journey is unchanged.</li>
            <li>{failureReason ? `Gateway note: ${failureReason}` : 'The payment gateway did not return a ticket.'}</li>
          </ul>
        </article>
      </div>

      <div className="action-row dual-actions">
        <Link className="secondary-button premium-secondary-button" to={`/payment/${detail.booking.id}`}>
          Try again
        </Link>
        <Link className="primary-button premium-primary-button" to="/">
          Start over
        </Link>
      </div>
    </section>
  )
}
