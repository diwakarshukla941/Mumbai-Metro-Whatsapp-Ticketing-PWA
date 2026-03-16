import type { Station } from '../types'

export function StationTrail({
  stations,
  fromStationId,
  toStationId,
}: {
  stations: Station[]
  fromStationId: string
  toStationId: string
}) {
  const originIndex = stations.findIndex((station) => station.id === fromStationId)
  const destinationIndex = stations.findIndex((station) => station.id === toStationId)
  const lowerBound = Math.min(originIndex, destinationIndex)
  const upperBound = Math.max(originIndex, destinationIndex)

  return (
    <section className="trail-card">
      <div className="trail-head">
        <p className="screen-kicker">Selected path</p>
        <div className="mini-train" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="trail-line" />
      <div className="trail-grid">
        {stations.map((station, index) => {
          const isOrigin = station.id === fromStationId
          const isDestination = station.id === toStationId
          const isActive =
            originIndex !== -1 &&
            destinationIndex !== -1 &&
            index >= lowerBound &&
            index <= upperBound

          return (
            <div
              key={station.id}
              className={`trail-stop ${isActive ? 'active' : ''} ${
                isOrigin || isDestination ? 'edge' : ''
              }`}
            >
              <span className="trail-dot" />
              <strong>{station.code}</strong>
              <small>{station.name}</small>
            </div>
          )
        })}
      </div>
    </section>
  )
}
