import type {
  BookingDetail,
  JourneyType,
  MetaResponse,
  Payment,
  Station,
  Ticket,
  TicketDetail,
} from './types'

type JsonRecord = Record<string, unknown>

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  const payload = (await response.json()) as JsonRecord

  if (!response.ok) {
    throw new Error(String(payload.message ?? 'Request failed.'))
  }

  return payload as T
}

export function fetchMeta() {
  return request<MetaResponse>('/api/line1/meta')
}

export function fetchFare(
  fromStationId: string,
  toStationId: string,
  journeyType: JourneyType,
  quantity: number,
) {
  return request<{ fare: BookingDetail['booking']['fare'] }>('/api/fare', {
    method: 'POST',
    body: JSON.stringify({
      fromStationId,
      toStationId,
      journeyType,
      quantity,
    }),
  })
}

export function createBooking(input: {
  fromStationId: string
  toStationId: string
  journeyType: JourneyType
  quantity: number
}) {
  return request<{
    booking: BookingDetail['booking']
    origin: Station
    destination: Station
  }>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function fetchBooking(bookingId: string) {
  return request<BookingDetail>(`/api/bookings/${bookingId}`)
}

export function createPaymentIntent(bookingId: string) {
  return request<{
    payment: Payment
    booking: BookingDetail['booking']
  }>('/api/payments/intent', {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
  })
}

export function confirmPayment(paymentId: string, method: string) {
  return request<{ payment: Payment; ticket: Ticket }>(`/api/payments/${paymentId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ method }),
  })
}

export function fetchTicket(ticketId: string) {
  return request<TicketDetail>(`/api/tickets/${ticketId}`)
}
