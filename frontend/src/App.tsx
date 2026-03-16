import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
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

function AppShell({ meta }: { meta: MetaResponse }) {
  return (
    <div className="app-shell mobile-shell">
      <div className="phone-frame">
        <header className="mobile-header">
          <p className="screen-kicker">Mumbai Metro One</p>
          <h2>Line 1 mobile PWA</h2>
          <span>{meta.lineMeta.route}</span>
        </header>

        <main className="mobile-main">
          <Routes>
            <Route path="/" element={<BookingPage meta={meta} />} />
            <Route path="/summary/:bookingId" element={<SummaryPage meta={meta} />} />
            <Route path="/payment/:bookingId" element={<PaymentPage />} />
            <Route path="/pending/:bookingId" element={<PendingPage />} />
            <Route path="/failed/:bookingId" element={<FailedPage />} />
            <Route path="/ticket/:ticketId" element={<TicketPage />} />
            <Route path="/scan/:ticketId" element={<ScanPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
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
    return <LoadingScreen label="Loading mobile ticketing experience..." />
  }

  return <AppShell meta={meta} />
}

export default App
