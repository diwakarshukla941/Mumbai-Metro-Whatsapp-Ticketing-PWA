import { startTransition, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBooking, fetchFare } from '../api'
import { StationTrail } from '../components/StationTrail'
import type { Fare, JourneyType, MetaResponse } from '../types'
import { formatCurrency, formatJourneyType } from '../utils'

type BookingFormState = {
  fromStationId: string
  toStationId: string
  journeyType: JourneyType
  quantity: number
}

const travelerOptions = [1, 2, 3, 4, 5, 6]

export function BookingPage({ meta }: { meta: MetaResponse }) {
  const navigate = useNavigate()
  const [formState, setFormState] = useState<BookingFormState>({
    fromStationId: meta.stations[0]?.id ?? '',
    toStationId: meta.stations.at(-1)?.id ?? '',
    journeyType: 'sjt',
    quantity: 1,
  })
  const [fare, setFare] = useState<Fare | null>(null)
  const [loadingFare, setLoadingFare] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!formState.fromStationId || !formState.toStationId) {
      return
    }

    if (formState.fromStationId === formState.toStationId) {
      setFare(null)
      setError('Choose two different stations.')
      return
    }

    let cancelled = false

    setLoadingFare(true)
    setError(null)

    fetchFare(
      formState.fromStationId,
      formState.toStationId,
      formState.journeyType,
      formState.quantity,
    )
      .then(({ fare: nextFare }) => {
        if (!cancelled) {
          setFare(nextFare)
        }
      })
      .catch((requestError: Error) => {
        if (!cancelled) {
          setFare(null)
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingFare(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    formState.fromStationId,
    formState.toStationId,
    formState.journeyType,
    formState.quantity,
  ])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const result = await createBooking(formState)
      startTransition(() => {
        navigate(`/summary/${result.booking.id}`)
      })
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="screen-card booking-screen">
      <div className="screen-copy">
        <p className="screen-kicker">Metro ride mode</p>
        <h1>Pick your vibe, then your ride.</h1>
        <p className="screen-text">
          Fast booking, a visible station trail, and a much louder ticketing experience.
        </p>
      </div>

      <form className="mobile-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Source</span>
          <select
            value={formState.fromStationId}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                fromStationId: event.target.value,
              }))
            }
          >
            {meta.stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Destination</span>
          <select
            value={formState.toStationId}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                toStationId: event.target.value,
              }))
            }
          >
            {meta.stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span>Journey type</span>
          <div className="segmented-grid">
            {(['sjt', 'rjt'] as JourneyType[]).map((journeyType) => (
              <button
                key={journeyType}
                type="button"
                className={`segment-button ${
                  formState.journeyType === journeyType ? 'active' : ''
                }`}
                onClick={() =>
                  setFormState((currentState) => ({
                    ...currentState,
                    journeyType,
                  }))
                }
              >
                <strong>{formatJourneyType(journeyType)}</strong>
                <small>
                  {journeyType === 'sjt' ? 'One way sprint' : 'Comeback combo'}
                </small>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>People</span>
          <div className="traveler-grid">
            {travelerOptions.map((count) => (
              <button
                key={count}
                type="button"
                className={`traveler-pill ${formState.quantity === count ? 'active' : ''}`}
                onClick={() =>
                  setFormState((currentState) => ({
                    ...currentState,
                    quantity: count,
                  }))
                }
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <StationTrail
          stations={meta.stations}
          fromStationId={formState.fromStationId}
          toStationId={formState.toStationId}
        />

        <div className="fare-sheet">
          <div className="fare-sheet-top">
            <div>
              <p className="screen-kicker">Estimated fare</p>
              <strong>
                {loadingFare
                  ? 'Calculating...'
                  : fare
                    ? formatCurrency(fare.totalFare)
                    : 'Select route'}
              </strong>
            </div>
            {loadingFare && <div className="fare-loader" aria-hidden="true" />}
          </div>

          <ul>
            <li>{fare?.routeLabel ?? 'Route preview will appear here'}</li>
            <li>{fare ? `${fare.journeyTypeLabel} for ${fare.quantity} people` : 'Max 6 people'}</li>
            <li>
              {fare
                ? `${fare.distanceKm} km estimated`
                : 'Fare updates instantly from the backend'}
            </li>
          </ul>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="primary-button" type="submit" disabled={submitting || !fare}>
          {submitting ? 'Preparing summary...' : 'Continue to summary'}
        </button>
      </form>
    </section>
  )
}
