export type JourneyType = 'sjt' | 'rjt'

export type Station = {
  id: string
  code: string
  name: string
  kmFromVersova: number
  platformNote: string
  landmark: string
}

export type LineMeta = {
  lineName: string
  route: string
  stationsCount: number
  serviceHours: string
  whatsappTicketingNumber: string
  fareBands: string[]
  officialSteps: string[]
  sources: Array<{
    title: string
    url: string
  }>
}

export type Fare = {
  currency: 'INR'
  distanceKm: number
  journeyType: JourneyType
  journeyTypeLabel: 'SJT' | 'RJT'
  baseFare: number
  tripMultiplier: number
  unitFare: number
  quantity: number
  totalFare: number
  estimatedTravelMinutes: number
  officialFareBands: number[]
  routeLabel: string
}

export type Booking = {
  id: string
  fromStationId: string
  toStationId: string
  journeyType: JourneyType
  travelDate: string
  quantity: number
  status: 'draft' | 'ticketed'
  fare: Fare
  paymentId?: string
  ticketId?: string
  createdAt: string
}

export type Payment = {
  id: string
  bookingId: string
  amount: number
  currency: string
  status: 'pending' | 'paid'
  createdAt: string
  method?: string
  transactionReference?: string
  paidAt?: string
}

export type Ticket = {
  id: string
  bookingId: string
  paymentId: string
  ticketNumber: string
  routeLabel: string
  issuedAt: string
  travelDate: string
  journeyType: JourneyType
  quantity: number
  amount: number
  qrPayload: string
  scanUrl?: string
  qrCodeDataUrl?: string
  validFrom: string
  validUntil: string
  validationToken: string
  validityNote: string
  whatsappAssistUrl: string
}

export type MetaResponse = {
  lineMeta: LineMeta
  stations: Station[]
}

export type BookingDetail = {
  booking: Booking
  origin: Station
  destination: Station
  payment: Payment | null
  ticket: Ticket | null
}

export type TicketDetail = {
  ticket: Ticket
  booking: Booking
  payment: Payment
  origin: Station
  destination: Station
}
