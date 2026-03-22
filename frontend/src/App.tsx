import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { fetchMeta } from './api'
import { LoadingScreen, StateMessage } from './components/States'
import { BookingPage } from './pages/BookingPage'
import { FailedPage } from './pages/FailedPage'
import { PaymentPage } from './pages/PaymentPage'
import { PendingPage } from './pages/PendingPage'
import { ScanPage } from './pages/ScanPage'
import { SummaryPage } from './pages/SummaryPage'
import { TicketPage } from './pages/TicketPage'
import type { MetaResponse } from './types'

function getStepForPath(pathname: string) {
  if (pathname.startsWith('/payment') || pathname.startsWith('/pending') || pathname.startsWith('/failed')) {
    return 2
  }

  if (pathname.startsWith('/ticket') || pathname.startsWith('/scan')) {
    return 3
  }

  return 1
}

function AppShell({ meta }: { meta: MetaResponse }) {
  const location = useLocation()
  const currentStep = getStepForPath(location.pathname)
  const steps = ['Book', 'Pay', 'Ticket']

  return (
    <div className="app-shell">
      <div className="backdrop-orb backdrop-orb-left" aria-hidden="true" />
      <div className="backdrop-orb backdrop-orb-right" aria-hidden="true" />

      <header className="app-header premium-header">
        <div className="header-top">
          <p className="eyebrow">Mumbai Metro One</p>
          <span className="status-pill">Line 1</span>
        </div>

        <div className="header-copy">
          <h1 className="app-title">Metro ticket booking</h1>
          <p className="header-route">{meta.lineMeta.route}</p>
        </div>

        <div className="header-stats" aria-label="Service snapshot">
          <div className="stat-chip">
            <span>Service</span>
            <strong>{meta.lineMeta.serviceHours}</strong>
          </div>
          <div className="stat-chip">
            <span>Stations</span>
            <strong>{meta.lineMeta.stationsCount}</strong>
          </div>
          <div className="stat-chip">
            <span>Fare band</span>
            <strong>{meta.lineMeta.fareBands.join(' / ')}</strong>
          </div>
        </div>
      </header>

      <div className="step-track compact-steps" aria-label="Booking steps">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const state =
            stepNumber < currentStep ? 'complete' : stepNumber === currentStep ? 'active' : ''

          return (
            <div key={step} className={`step-chip ${state}`.trim()}>
              <span>{stepNumber}</span>
              <strong>{step}</strong>
            </div>
          )
        })}
      </div>

      <main className="main-column">
        <Routes>
          <Route path="/" element={<BookingPage meta={meta} />} />
          <Route path="/summary/:bookingId" element={<SummaryPage />} />
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/pending/:bookingId" element={<PendingPage />} />
          <Route path="/failed/:bookingId" element={<FailedPage />} />
          <Route path="/ticket/:ticketId" element={<TicketPage />} />
          <Route path="/scan/:ticketId" element={<ScanPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  const [meta, setMeta] = useState<MetaResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMeta()
      .then((result) => {
        setMeta(result)
      })
      .catch((requestError: Error) => {
        setError(requestError.message)
      })
  }, [])

  if (error) {
    return <StateMessage title="Metro data unavailable" body={error} />
  }

  if (!meta) {
    return <LoadingScreen label="Loading booking flow..." />
  }

  return <AppShell meta={meta} />
}

export default App
