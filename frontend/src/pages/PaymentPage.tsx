import { startTransition, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createPaymentIntent, fetchBooking } from '../api'
import { LoadingScreen, StateMessage } from '../components/States'
import type { BookingDetail } from '../types'
import { formatCurrency, formatJourneyType } from '../utils'

const paymentMethods = [
  { id: 'upi', label: 'UPI', detail: 'Instant mobile payment' },
  { id: 'card', label: 'Card', detail: 'Credit or debit card' },
  { id: 'netbanking', label: 'Net Banking', detail: 'Direct bank payment' },
] as const

export function PaymentPage() {
  const navigate = useNavigate()
  const { bookingId } = useParams()
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<(typeof paymentMethods)[number]['id']>('upi')
  const [error, setError] = useState<string | null>(null)
  const selectedMethodMeta = paymentMethods.find((method) => method.id === selectedMethod) ?? paymentMethods[0]

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

  const onConfirmPayment = async () => {
    if (!detail) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const paymentIntent = await createPaymentIntent(detail.booking.id)
      startTransition(() => {
        const searchParams = new URLSearchParams({
          paymentId: paymentIntent.payment.id,
          method: selectedMethod,
        })
        navigate(`/pending/${detail.booking.id}?${searchParams.toString()}`)
      })
    } catch (requestError) {
      setError((requestError as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <LoadingScreen label="Loading payment..." />
  }

  if (!detail) {
    return <StateMessage title="Payment unavailable" body={error ?? 'Booking could not be loaded.'} />
  }

  return (
    <section className="surface-card page-card simple-page premium-page">
      <div className="page-heading">
        <span className="page-kicker">Step 3</span>
        <h2>Checkout</h2>
        <p>Choose a payment method and continue to the secure gateway handoff.</p>
      </div>

      <div className="payment-hero">
        <div>
          <span className="field-label">Total payable</span>
          <strong>{formatCurrency(detail.booking.fare.totalFare)}</strong>
        </div>
        <p>
          {detail.origin.name} to {detail.destination.name} /{' '}
          {formatJourneyType(detail.booking.journeyType)} / {detail.booking.quantity} person(s)
        </p>
      </div>

      <div className="choice-grid payment-method-grid" role="radiogroup" aria-label="Payment method">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={selectedMethod === method.id}
            className={`choice-card premium-choice-card ${
              selectedMethod === method.id ? 'active' : ''
            }`}
            onClick={() => setSelectedMethod(method.id)}
          >
            <strong>{method.label}</strong>
            <span>{method.detail}</span>
          </button>
        ))}
      </div>

      <div className="surface-subcard payment-trust-card">
        <div>
          <span className="field-label">Gateway handoff</span>
          <strong>{selectedMethodMeta.label} selected</strong>
        </div>
        <p>
          Continue through the payment redirect state before the QR ticket is issued, similar to the live
          WhatsApp-style flow.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="action-row dual-actions">
        <button className="secondary-button premium-secondary-button" type="button" onClick={() => navigate(-1)}>
          Back
        </button>
        <button
          className="primary-button premium-primary-button"
          type="button"
          onClick={onConfirmPayment}
          disabled={processing}
        >
          {processing ? 'Preparing gateway...' : 'Continue to gateway'}
        </button>
      </div>
    </section>
  )
}
