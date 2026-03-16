import type { Station } from '../types'

export function JourneyMap({
  stations,
  fromStationId,
  toStationId,
}: {
  stations: Station[]
  fromStationId: string
  toStationId: string
}) {
  const fromIndex = stations.findIndex((station) => station.id === fromStationId)
  const toIndex = stations.findIndex((station) => station.id === toStationId)
  const lowerBound = Math.min(fromIndex, toIndex)
  const upperBound = Math.max(fromIndex, toIndex)

  return (
    <div className="journey-map">
      <div className="line-track" />
      <div className="station-row">
        {stations.map((station, index) => {
          const selected = index === fromIndex || index === toIndex
          const onPath =
            index >= lowerBound && index <= upperBound && fromIndex !== -1 && toIndex !== -1

          return (
            <div
              key={station.id}
              className={`station-pill ${selected ? 'selected' : ''} ${onPath ? 'on-path' : ''}`}
            >
              <span className="station-dot" />
              <strong>{station.code}</strong>
              <small>{station.name}</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}
