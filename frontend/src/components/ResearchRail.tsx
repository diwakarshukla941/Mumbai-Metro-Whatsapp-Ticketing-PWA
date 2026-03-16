import type { LineMeta } from '../types'

export function ResearchRail({ lineMeta }: { lineMeta: LineMeta }) {
  return (
    <aside className="side-rail">
      <div className="rail-card">
        <p className="plate-label">WhatsApp flow</p>
        <ol className="number-list">
          {lineMeta.officialSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="rail-card">
        <p className="plate-label">Source links</p>
        <div className="source-list">
          {lineMeta.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.title}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}
