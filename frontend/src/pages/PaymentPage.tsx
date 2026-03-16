import { startTransition, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { confirmPayment, createPaymentIntent, fetchBooking } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { BookingDetail } from '../types'
import { formatCurrency, formatJourneyType } from '../utils'

type PaymentOutcome = 'success' | 'pending' | 'failed'

const outcomeOptions: Array<{
  id: PaymentOutcome
  title: string
  detail: string
}> = [
  {
    id: 'success',
    title: 'Success',
    detail: 'Fire the confetti and issue the ticket.',
  },
  {
    id: 'pending',
    title: 'Pending',
    detail: 'Pause the ride and show a waiting state.',
  },
  {
    id: 'failed',
    title: 'Failed',
    detail: 'Kick to failure and try again from booking.',
  },
]

export function PaymentPage() {
  const navigate = useNavigate()
  const { bookingId } = useParams()
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<PaymentOutcome>('success')
  const [error, setError] = useState<string | null>(null)

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
            navigate(`/ticket/${existingTicket.id}`)
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

  const onSimulatePayment = async () => {
    if (!detail) {
      return
    }

    if (selectedOutcome === 'pending') {
      startTransition(() => {
        navigate(`/pending/${detail.booking.id}`)
      })
      return
    }

    if (selectedOutcome === 'failed') {
      startTransition(() => {
        navigate(`/failed/${detail.booking.id}`)
      })
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const paymentIntent = await createPaymentIntent(detail.booking.id)
      const result = await confirmPayment(paymentIntent.payment.id, 'upi')
      startTransition(() => {
        navigate(`/ticket/${result.ticket.id}`)
      })
    } catch (requestError) {
      setError((requestError as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <LoadingScreen label="Loading dummy payment gateway..." />
  }

  if (!detail) {
    return <StateMessage title="Payment unavailable" body={error ?? 'Booking could not be loaded.'} />
  }

  return (
    <section className="screen-card payment-screen">
      <div className="screen-copy">
        <p className="screen-kicker">Dummy gateway</p>
        <h1>Choose the ending.</h1>
        <p className="screen-text">
          This gateway is intentionally playful. Pick a result and watch the flow respond.
        </p>
      </div>

      <div className="summary-panel compact">
        <strong>{detail.origin.name} to {detail.destination.name}</strong>
        <p>
          {formatJourneyType(detail.booking.journeyType)} / {detail.booking.quantity} people /{' '}
          {formatCurrency(detail.booking.fare.totalFare)}
        </p>
      </div>

      <div className="outcome-list">
        {outcomeOptions.map((outcome) => (
          <button
            key={outcome.id}
            type="button"
            className={`outcome-card ${selectedOutcome === outcome.id ? 'active' : ''}`}
            onClick={() => setSelectedOutcome(outcome.id)}
          >
            <strong>{outcome.title}</strong>
            <span>{outcome.detail}</span>
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      <button
        className="primary-button"
        type="button"
        onClick={onSimulatePayment}
        disabled={processing}
      >
        {processing ? 'Processing...' : `Simulate ${selectedOutcome}`}
      </button>

      {processing && (
        <div className="payment-burst" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
    </section>
  )
}
