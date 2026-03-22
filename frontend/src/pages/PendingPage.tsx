import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchBooking } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { BookingDetail } from '../types'
import { formatCurrency } from '../utils'

export function PendingPage() {
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
    return <LoadingScreen label="Checking payment status..." />
  }

  if (!detail) {
    return (
      <StateMessage title="Pending status unavailable" body={error ?? 'Booking could not be loaded.'} />
    )
  }

  return (
    <section className="surface-card page-card">
      <div className="section-intro">
        <p className="eyebrow">Payment pending</p>
        <h2>The payment has not been marked complete yet.</h2>
        <p>
          Retry the transaction or return to booking if the passenger needs a new trip setup.
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
        <Link className="secondary-button" to={`/payment/${detail.booking.id}`}>
          Retry payment
        </Link>
        <Link className="primary-button" to="/">
          Start over
        </Link>
      </div>
    </section>
  )
}
