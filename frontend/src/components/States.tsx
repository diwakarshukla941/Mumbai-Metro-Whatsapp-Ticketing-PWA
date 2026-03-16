import { Link } from 'react-router-dom'

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="state-panel">
      <div className="loader-scene" aria-hidden="true">
        <div className="loader-track" />
        <div className="loader-train">
          <span />
          <span />
          <span />
        </div>
      </div>
      <p>{label}</p>
    </div>
  )
}

export function StateMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="state-panel">
      <h2>{title}</h2>
      <p>{body}</p>
      <Link className="secondary-button" to="/">
        Back to booking
      </Link>
    </div>
  )
}
