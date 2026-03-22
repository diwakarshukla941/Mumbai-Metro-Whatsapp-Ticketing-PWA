import { startTransition, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBooking, fetchFare } from '../api'
import { StationTrail } from '../components/StationTrail'
import type { Fare, JourneyType, MetaResponse } from '../types'
import { formatCurrency, formatJourneyType, todayAsInputValue } from '../utils'

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
      setError('Source and destination should be different.')
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
      const result = await createBooking({
        ...formState,
        travelDate: todayAsInputValue(),
      })
      startTransition(() => {
        navigate(`/summary/${result.booking.id}`)
      })
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const swapStations = () => {
    setFormState((currentState) => ({
      ...currentState,
      fromStationId: currentState.toStationId,
      toStationId: currentState.fromStationId,
    }))
  }

  return (
    <section className="surface-card page-card simple-page premium-page">
      <div className="page-heading">
        <span className="page-kicker">Step 1</span>
        <h2>Book your journey</h2>
        <p>Select stations, choose ticket type, and review fare before payment.</p>
      </div>

      <form className="form-stack" onSubmit={onSubmit}>
        <div className="simple-grid">
          <label className="field-card premium-field-card">
            <span className="field-label">Source</span>
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

          <label className="field-card premium-field-card">
            <span className="field-label">Destination</span>
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
        </div>

        <button className="ghost-action premium-ghost-action" type="button" onClick={swapStations}>
          Swap stations
        </button>

        <div className="choice-grid simple-choice-grid" role="radiogroup" aria-label="Journey type">
          {(['sjt', 'rjt'] as JourneyType[]).map((journeyType) => (
            <button
              key={journeyType}
              type="button"
              role="radio"
              aria-checked={formState.journeyType === journeyType}
              className={`choice-card premium-choice-card ${
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
              <span>{journeyType === 'sjt' ? 'Single Journey' : 'Return Journey'}</span>
            </button>
          ))}
        </div>

        <div className="field-card premium-field-card">
          <span className="field-label">Number of persons</span>
          <div className="pill-row" role="radiogroup" aria-label="Passengers">
            {travelerOptions.map((count) => (
              <button
                key={count}
                type="button"
                role="radio"
                aria-checked={formState.quantity === count}
                className={`select-pill premium-select-pill ${
                  formState.quantity === count ? 'active' : ''
                }`}
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

        <div className="fare-card premium-fare-card" aria-live="polite">
          <div>
            <span className="field-label">Estimated fare</span>
            <strong>
              {loadingFare
                ? 'Calculating...'
                : fare
                  ? formatCurrency(fare.totalFare)
                  : 'Select route'}
            </strong>
          </div>
          <p>
            {fare
              ? `${fare.routeLabel} / ${fare.quantity} person(s) / ${fare.journeyTypeLabel}`
              : 'Choose route and journey type to see the fare.'}
          </p>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="primary-button premium-primary-button" type="submit" disabled={submitting || !fare}>
          {submitting ? 'Preparing summary...' : 'Continue'}
        </button>
      </form>
    </section>
  )
}
