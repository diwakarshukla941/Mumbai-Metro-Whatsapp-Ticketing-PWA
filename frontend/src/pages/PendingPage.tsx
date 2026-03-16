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
    return <LoadingScreen label="Checking pending payment..." />
  }

  if (!detail) {
    return <StateMessage title="Pending status unavailable" body={error ?? 'Booking could not be loaded.'} />
  }

  return (
    <section className="screen-card status-screen status-pending">
      <p className="screen-kicker">Payment pending</p>
      <h1>We have not marked this payment as complete yet.</h1>
      <p className="screen-text">
        The dummy gateway returned a pending status for {detail.origin.name} to{' '}
        {detail.destination.name}.
      </p>
      <div className="summary-panel">
        <strong>{formatCurrency(detail.booking.fare.totalFare)}</strong>
        <p>Retry payment or start a fresh booking.</p>
      </div>
      <div className="screen-actions">
        <Link className="secondary-button" to={`/payment/${detail.booking.id}`}>
          Retry payment
        </Link>
        <Link className="primary-button" to="/">
          New booking
        </Link>
      </div>
    </section>
  )
}
