import { stationMap } from '../data/stations.js'

const fareBrackets = [
  { maxDistanceKm: 2, amount: 10 },
  { maxDistanceKm: 5, amount: 20 },
  { maxDistanceKm: 8, amount: 30 },
  { maxDistanceKm: Number.POSITIVE_INFINITY, amount: 40 },
]
const stationIds = Array.from(stationMap.keys())
const journeyTypeLabels = {
  sjt: 'SJT',
  rjt: 'RJT',
}

export function getStationOrThrow(stationId) {
  const station = stationMap.get(stationId)

  if (!station) {
    throw new Error(`Unknown station: ${stationId}`)
  }

  return station
}

export function calculateFare({ fromStationId, toStationId, journeyType = 'sjt', quantity }) {
  const origin = getStationOrThrow(fromStationId)
  const destination = getStationOrThrow(toStationId)
  const ticketCount = Number(quantity)
  const requestedJourneyType = String(journeyType).trim().toLowerCase()

  if (!Number.isInteger(ticketCount) || ticketCount < 1 || ticketCount > 6) {
    throw new Error('Ticket quantity must be between 1 and 6.')
  }

  if (!Object.hasOwn(journeyTypeLabels, requestedJourneyType)) {
    throw new Error('Journey type must be SJT or RJT.')
  }

  if (origin.id === destination.id) {
    throw new Error('Origin and destination must be different.')
  }

  const distanceKm = Math.abs(destination.kmFromVersova - origin.kmFromVersova)
  const baseFare =
    fareBrackets.find((bracket) => distanceKm <= bracket.maxDistanceKm)?.amount ?? 40
  const tripMultiplier = requestedJourneyType === 'rjt' ? 2 : 1
  const unitFare = baseFare * tripMultiplier
  const totalFare = unitFare * ticketCount
  const stationSpan = Math.abs(
    stationIds.indexOf(origin.id) - stationIds.indexOf(destination.id),
  )
  const estimatedTravelMinutes = Math.max(6, stationSpan * 2 + 4)

  return {
    currency: 'INR',
    distanceKm: Number(distanceKm.toFixed(1)),
    journeyType: requestedJourneyType,
    journeyTypeLabel: journeyTypeLabels[requestedJourneyType],
    baseFare,
    tripMultiplier,
    unitFare,
    quantity: ticketCount,
    totalFare,
    estimatedTravelMinutes,
    officialFareBands: fareBrackets.map((bracket) => bracket.amount),
    routeLabel: `${origin.name} to ${destination.name}`,
  }
}
