import { startTransition, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchBooking } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { BookingDetail } from '../types'
import { formatCurrency, formatJourneyType } from '../utils'

export function SummaryPage() {
  const navigate = useNavigate()
  const { bookingId } = useParams()
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
    return <LoadingScreen label="Loading summary..." />
  }

  if (!detail) {
    return <StateMessage title="Summary unavailable" body={error ?? 'Booking could not be loaded.'} />
  }

  return (
    <section className="surface-card page-card simple-page premium-page">
      <div className="page-heading">
        <span className="page-kicker">Step 2</span>
        <h2>Journey summary</h2>
        <p>Review your trip details before moving to payment.</p>
      </div>

      <div className="route-hero">
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

      <div className="summary-card premium-summary-card">
        <div className="summary-row">
          <span>Journey type</span>
          <strong>{formatJourneyType(detail.booking.journeyType)}</strong>
        </div>
        <div className="summary-row">
          <span>Persons</span>
          <strong>{detail.booking.quantity}</strong>
        </div>
        <div className="summary-row">
          <span>Total fare</span>
          <strong>{formatCurrency(detail.booking.fare.totalFare)}</strong>
        </div>
        <div className="summary-row">
          <span>Estimated travel time</span>
          <strong>{detail.booking.fare.estimatedTravelMinutes} min</strong>
        </div>
      </div>

      <div className="action-row dual-actions">
        <Link className="secondary-button premium-secondary-button" to="/">
          Edit booking
        </Link>
        <button
          className="primary-button premium-primary-button"
          type="button"
          onClick={() =>
            startTransition(() => {
              navigate(`/payment/${detail.booking.id}`)
            })
          }
        >
          Proceed to payment
        </button>
      </div>
    </section>
  )
}
