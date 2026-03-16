import type { LineMeta } from '../types'

export function StepHeader({
  currentStep,
  lineMeta,
}: {
  currentStep: 1 | 2 | 3
  lineMeta: LineMeta
}) {
  const steps = [
    { id: 1, label: 'Book' },
    { id: 2, label: 'Pay' },
    { id: 3, label: 'Ticket' },
  ]

  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Metro One Line 1 PWA</p>
        <h1>WhatsApp-style ticketing for the Versova to Ghatkopar corridor.</h1>
        <p className="hero-text">
          Built as an installable web app with booking, payment, QR ticket delivery,
          and backend APIs designed around the real Metro One Line 1 flow.
        </p>
        <div className="hero-badges">
          <span>{lineMeta.route}</span>
          <span>{lineMeta.serviceHours}</span>
          <span>{lineMeta.whatsappTicketingNumber}</span>
        </div>
      </div>

      <div className="hero-research">
        <p className="plate-label">official reference</p>
        <ul className="facts-grid">
          <li>
            <strong>{lineMeta.stationsCount}</strong>
            stations on the operational corridor
          </li>
          <li>
            <strong>{lineMeta.fareBands.join(' / ')}</strong>
            current single-journey fare slabs
          </li>
          <li>
            <strong>Send "Hi"</strong>
            to start the official WhatsApp assisted journey
          </li>
        </ul>
      </div>

      <div className="stepper">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`step-chip ${step.id === currentStep ? 'active' : ''} ${
              step.id < currentStep ? 'complete' : ''
            }`}
          >
            <span>{step.id}</span>
            <strong>{step.label}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
