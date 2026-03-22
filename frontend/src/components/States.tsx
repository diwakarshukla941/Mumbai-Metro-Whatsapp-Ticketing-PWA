import { Link } from 'react-router-dom'

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="status-shell">
      <div className="status-card">
        <div className="loader-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">Loading</p>
        <h2>{label}</h2>
      </div>
    </div>
  )
}

export function StateMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="status-shell">
      <div className="status-card">
        <p className="eyebrow">Attention</p>
        <h2>{title}</h2>
        <p>{body}</p>
        <Link className="secondary-button" to="/">
          Back to booking
        </Link>
      </div>
    </div>
  )
}
