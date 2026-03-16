import QRCode from 'qrcode'

const metroWhatsappNumber = '919670008889'

export async function buildTicket({
  booking,
  payment,
  origin,
  destination,
  fare,
  baseUrl,
}) {
  const ticketId = crypto.randomUUID()
  const ticketNumber = `MM1-${Date.now().toString().slice(-8)}`
  const scanUrl = `${baseUrl}/scan/${ticketId}`
  const qrPayload = scanUrl
  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 320,
    color: {
      dark: '#0d1013',
      light: '#f7f2e8',
    },
  })
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
    qrCodeDataUrl,
    validityNote: 'Valid for the selected Mumbai Metro One service day.',
    whatsappAssistUrl: `https://wa.me/${metroWhatsappNumber}?text=${encodeURIComponent(
      whatsappMessage,
    )}`,
  }
}
