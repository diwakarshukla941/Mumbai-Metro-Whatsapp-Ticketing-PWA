import QRCode from 'qrcode'

const metroWhatsappNumber = '919670008889'
const qrCache = new Map()
const qrCacheLimit = 500

function setQrCache(cacheKey, qrCodeDataUrl) {
  qrCache.set(cacheKey, qrCodeDataUrl)

  if (qrCache.size > qrCacheLimit) {
    const firstKey = qrCache.keys().next().value
    qrCache.delete(firstKey)
  }
}

export function buildTicket({ booking, payment, origin, destination, fare, baseUrl }) {
  const ticketId = crypto.randomUUID()
  const ticketNumber = `MM1-${Date.now().toString().slice(-8)}`
  const scanUrl = `${baseUrl}/scan/${ticketId}`
  const qrPayload = scanUrl
  const validFrom = new Date(`${booking.travelDate}T05:30:00+05:30`).toISOString()
  const validUntil = new Date(`${booking.travelDate}T23:50:00+05:30`).toISOString()
  const validationToken = crypto.randomUUID().slice(0, 8).toUpperCase()

  const whatsappMessage = [
    'Hi Metro One,',
    `I booked a Line 1 ticket for ${origin.name} to ${destination.name}.`,
    `Journey type: ${booking.journeyType.toUpperCase()}.`,
    `Booking ID: ${booking.id}`,
    `Ticket No: ${ticketNumber}`,
  ].join(' ')

  return {
    id: ticketId,
    bookingId: booking.id,
    paymentId: payment.id,
    ticketNumber,
    routeLabel: `${origin.name} to ${destination.name}`,
    issuedAt: new Date().toISOString(),
    travelDate: booking.travelDate,
    journeyType: booking.journeyType,
    quantity: booking.quantity,
    amount: fare.totalFare,
    qrPayload,
    scanUrl,
    validFrom,
    validUntil,
    validationToken,
    validityNote: 'Valid only on the selected Mumbai Metro One service day.',
    whatsappAssistUrl: `https://wa.me/${metroWhatsappNumber}?text=${encodeURIComponent(
      whatsappMessage,
    )}`,
  }
}

export async function attachTicketQr(ticket) {
  const cacheKey = ticket.scanUrl ?? ticket.qrPayload
  const cachedQrCode = qrCache.get(cacheKey)

  if (cachedQrCode) {
    return {
      ...ticket,
      qrCodeDataUrl: cachedQrCode,
    }
  }

  const qrCodeDataUrl = await QRCode.toDataURL(cacheKey, {
    margin: 1,
    width: 320,
    color: {
      dark: '#0d1013',
      light: '#f7f2e8',
    },
  })

  setQrCache(cacheKey, qrCodeDataUrl)

  return {
    ...ticket,
    qrCodeDataUrl,
  }
}
