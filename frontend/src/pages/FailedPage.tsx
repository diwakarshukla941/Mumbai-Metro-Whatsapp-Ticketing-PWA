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
    return <LoadingScreen label="Loading failure state..." />
  }

  if (!detail) {
    return <StateMessage title="Failure state unavailable" body={error ?? 'Booking could not be loaded.'} />
  }

  return (
    <section className="screen-card status-screen status-failed">
      <p className="screen-kicker">Payment failed</p>
      <h1>Your payment did not go through.</h1>
      <p className="screen-text">
        The simulated gateway failed the transaction for {detail.origin.name} to{' '}
        {detail.destination.name}.
      </p>
      <div className="screen-actions">
        <Link className="primary-button" to="/">
          Try again
        </Link>
      </div>
    </section>
  )
}
