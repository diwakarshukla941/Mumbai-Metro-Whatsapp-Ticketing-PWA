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

  if (originIndex === -1 || destinationIndex === -1) {
    return null
  }

  const origin = stations[originIndex]
  const destination = stations[destinationIndex]
  const stopCount = Math.abs(destinationIndex - originIndex)

  return (
    <section className="surface-subcard trail-card compact-trail">
      <span className="field-label">Selected route</span>

      <div className="route-preview">
        <strong>{origin.name}</strong>
        <span className="route-arrow" aria-hidden="true" />
        <strong>{destination.name}</strong>
      </div>

      <p className="trail-summary">{stopCount} stops</p>
    </section>
  )
}
