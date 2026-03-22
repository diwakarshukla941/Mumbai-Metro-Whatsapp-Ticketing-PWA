import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchBooking } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { BookingDetail } from '../types'

export function FailedPage() {
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
    return <LoadingScreen label="Loading payment failure state..." />
  }

  if (!detail) {
    return (
      <StateMessage title="Failure state unavailable" body={error ?? 'Booking could not be loaded.'} />
    )
  }

  return (
    <section className="surface-card page-card">
      <div className="section-intro">
        <p className="eyebrow">Payment failed</p>
        <h2>The transaction did not complete.</h2>
        <p>
          No ticket has been issued for this booking. Start again when the passenger is ready.
        </p>
      </div>

      <div className="info-grid">
        <article className="info-card">
          <p className="eyebrow">Affected journey</p>
          <ul className="info-list">
            <li>{detail.origin.name}</li>
            <li>{detail.destination.name}</li>
            <li>{detail.booking.fare.routeLabel}</li>
          </ul>
        </article>
      </div>

      <div className="action-row">
        <Link className="primary-button" to="/">
          Try a new booking
        </Link>
      </div>
    </section>
  )
}
