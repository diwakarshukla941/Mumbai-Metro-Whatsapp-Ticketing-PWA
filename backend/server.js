import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import { stations, stationMap } from './src/data/stations.js'
import { calculateFare, getStationOrThrow } from './src/lib/fare.js'
import { readStore, writeStore } from './src/lib/storage.js'
import { buildTicket } from './src/lib/ticket.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const port = Number(process.env.PORT ?? 4000)
const frontendDistPath = path.resolve(__dirname, '../frontend/dist')

const lineMeta = {
  lineName: 'Mumbai Metro One Line 1',
  route: 'Versova - Andheri - Ghatkopar',
  stationsCount: stations.length,
  serviceHours: '05:30 to 23:50',
  whatsappTicketingNumber: '+91 96700 08889',
  fareBands: ['Rs 10', 'Rs 20', 'Rs 30', 'Rs 40'],
  officialSteps: [
    'Send "Hi" on WhatsApp to the official Metro One ticketing number.',
    'Pick origin, destination, and ticket count for Line 1.',
    'Complete payment inside the guided flow.',
    'Receive the QR ticket and use it at the AFC gate.',
  ],
  sources: [
    {
      title: 'Metro One official home page',
      url: 'https://www.reliancemumbaimetro.com/',
    },
    {
      title: 'Metro One tickets and fares page',
      url: 'https://www.reliancemumbaimetro.com/tickets-fares.aspx',
    },
    {
      title: 'Indian Express report on Metro One WhatsApp ticketing',
      url: 'https://indianexpress.com/article/cities/mumbai/mumbai-metro-line-1-now-book-tickets-on-whatsapp-8473712/',
    },
  ],
}

async function ensureScannableTicket(ticket, baseUrl) {
  const scanUrl = `${baseUrl}/scan/${ticket.id}`

  if (ticket.scanUrl === scanUrl && ticket.qrPayload === scanUrl) {
    return {
      ...ticket,
      scanUrl,
      qrPayload: scanUrl,
    }
  }

  const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
    margin: 1,
    width: 320,
    color: {
      dark: '#0d1013',
      light: '#f7f2e8',
    },
  })

  return {
    ...ticket,
    scanUrl,
    qrPayload: scanUrl,
    qrCodeDataUrl,
  }
}

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/line1/meta', (_request, response) => {
  response.json({
    lineMeta,
    stations,
  })
})

app.post('/api/fare', (request, response) => {
  try {
    const { fromStationId, toStationId, journeyType = 'sjt', quantity = 1 } =
      request.body ?? {}
    const fare = calculateFare({
      fromStationId,
      toStationId,
      journeyType,
      quantity: Number(quantity),
    })

    response.json({ fare })
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
})

app.post('/api/bookings', async (request, response) => {
  try {
    const {
      fromStationId,
      toStationId,
      journeyType = 'sjt',
      travelDate,
      quantity,
    } = request.body ?? {}

    const resolvedTravelDate = travelDate ?? new Date().toISOString().slice(0, 10)

    if (resolvedTravelDate < new Date().toISOString().slice(0, 10)) {
      throw new Error('Travel date cannot be in the past.')
    }

    const ticketCount = Number(quantity)

    const fare = calculateFare({
      fromStationId,
      toStationId,
      journeyType,
      quantity: ticketCount,
    })

    const store = await readStore()
    const booking = {
      id: crypto.randomUUID(),
      fromStationId,
      toStationId,
      journeyType: String(journeyType).trim().toLowerCase(),
      travelDate: resolvedTravelDate,
      quantity: ticketCount,
      status: 'draft',
      fare,
      createdAt: new Date().toISOString(),
    }

    store.bookings.push(booking)
    await writeStore(store)

    response.status(201).json({
      booking,
      origin: getStationOrThrow(fromStationId),
      destination: getStationOrThrow(toStationId),
    })
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
})

app.get('/api/bookings/:bookingId', async (request, response) => {
  const store = await readStore()
  const booking = store.bookings.find(
    (candidate) => candidate.id === request.params.bookingId,
  )

  if (!booking) {
    response.status(404).json({ message: 'Booking not found.' })
    return
  }

  response.json({
    booking,
    origin: getStationOrThrow(booking.fromStationId),
    destination: getStationOrThrow(booking.toStationId),
    payment: store.payments.find((candidate) => candidate.id === booking.paymentId) ?? null,
    ticket: store.tickets.find((candidate) => candidate.id === booking.ticketId) ?? null,
  })
})

app.post('/api/payments/intent', async (request, response) => {
  try {
    const { bookingId } = request.body ?? {}
    const store = await readStore()
    const booking = store.bookings.find((candidate) => candidate.id === bookingId)

    if (!booking) {
      response.status(404).json({ message: 'Booking not found.' })
      return
    }

    const existingPayment = store.payments.find(
      (candidate) => candidate.bookingId === bookingId,
    )

    if (existingPayment) {
      response.json({ payment: existingPayment, booking })
      return
    }

    const payment = {
      id: crypto.randomUUID(),
      bookingId,
      amount: booking.fare.totalFare,
      currency: booking.fare.currency,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    booking.paymentId = payment.id
    store.payments.push(payment)
    await writeStore(store)

    response.status(201).json({ payment, booking })
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
})

app.post('/api/payments/:paymentId/confirm', async (request, response) => {
  try {
    const allowedMethods = new Set(['upi', 'card', 'netbanking'])
    const selectedMethod = String(request.body?.method ?? '').trim().toLowerCase()

    if (!allowedMethods.has(selectedMethod)) {
      throw new Error('Unsupported payment method.')
    }

    const store = await readStore()
    const payment = store.payments.find(
      (candidate) => candidate.id === request.params.paymentId,
    )

    if (!payment) {
      response.status(404).json({ message: 'Payment not found.' })
      return
    }

    const booking = store.bookings.find(
      (candidate) => candidate.id === payment.bookingId,
    )

    if (!booking) {
      response.status(404).json({ message: 'Booking not found.' })
      return
    }

    if (payment.status === 'paid' && booking.ticketId) {
      const existingTicket = store.tickets.find(
        (candidate) => candidate.id === booking.ticketId,
      )

      response.json({ payment, ticket: existingTicket })
      return
    }

    payment.status = 'paid'
    payment.method = selectedMethod
    payment.transactionReference = `TXN-${Date.now()}`
    payment.paidAt = new Date().toISOString()

    booking.status = 'ticketed'

    const origin = getStationOrThrow(booking.fromStationId)
    const destination = getStationOrThrow(booking.toStationId)
    const baseUrl = `${request.protocol}://${request.get('host')}`
    const rawTicket = await buildTicket({
      booking,
      payment,
      origin,
      destination,
      fare: booking.fare,
      baseUrl,
    })
    const ticket = await ensureScannableTicket(rawTicket, baseUrl)

    booking.ticketId = ticket.id
    store.tickets.push(ticket)
    await writeStore(store)

    response.json({ payment, ticket })
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
})

app.get('/api/tickets/:ticketId', async (request, response) => {
  const store = await readStore()
  const ticket = store.tickets.find((candidate) => candidate.id === request.params.ticketId)

  if (!ticket) {
    response.status(404).json({ message: 'Ticket not found.' })
    return
  }

  const booking = store.bookings.find((candidate) => candidate.id === ticket.bookingId)
  const payment = store.payments.find((candidate) => candidate.id === ticket.paymentId)

  response.json({
    ticket,
    booking,
    payment,
    origin: booking ? stationMap.get(booking.fromStationId) : null,
    destination: booking ? stationMap.get(booking.toStationId) : null,
  })
})

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath))
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Mumbai Metro One backend running on http://localhost:${port}`)
})
