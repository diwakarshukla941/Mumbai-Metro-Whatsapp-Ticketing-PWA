import { startTransition, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchBooking } from '../api'
import { StationTrail } from '../components/StationTrail'
import { LoadingScreen, StateMessage } from '../components/States'
import type { BookingDetail, MetaResponse } from '../types'
import { formatCurrency, formatJourneyType } from '../utils'

export function SummaryPage({ meta }: { meta: MetaResponse }) {
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
    return <LoadingScreen label="Loading journey summary..." />
  }

  if (!detail) {
    return <StateMessage title="Summary unavailable" body={error ?? 'Booking could not be loaded.'} />
  }

  return (
    <section className="screen-card summary-screen">
      <div className="screen-copy">
        <p className="screen-kicker">Trip remix</p>
        <h1>Looks good. Lock it in.</h1>
      </div>

      <div className="route-card">
        <span>{detail.origin.name}</span>
        <div className="route-line" />
        <span>{detail.destination.name}</span>
      </div>

      <StationTrail
        stations={meta.stations}
        fromStationId={detail.booking.fromStationId}
        toStationId={detail.booking.toStationId}
      />

      <dl className="detail-grid">
        <div>
          <dt>Journey</dt>
          <dd>{formatJourneyType(detail.booking.journeyType)}</dd>
        </div>
        <div>
          <dt>People</dt>
          <dd>{detail.booking.quantity}</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{detail.booking.fare.distanceKm} km</dd>
        </div>
        <div>
          <dt>Fare</dt>
          <dd>{formatCurrency(detail.booking.fare.totalFare)}</dd>
        </div>
      </dl>

      <div className="summary-panel">
        <div>
          <p className="screen-kicker">Trip total</p>
          <strong>{formatCurrency(detail.booking.fare.totalFare)}</strong>
        </div>
        <p>
          {detail.booking.fare.journeyTypeLabel} with {detail.booking.quantity} passenger
          {detail.booking.quantity > 1 ? 's' : ''}.
        </p>
      </div>

      <div className="screen-actions">
        <Link className="secondary-button" to="/">
          Edit booking
        </Link>
        <button
          className="primary-button"
          type="button"
          onClick={() =>
            startTransition(() => {
              navigate(`/payment/${detail.booking.id}`)
            })
          }
        >
          Pay now
        </button>
      </div>
    </section>
  )
}
