import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { stations, stationMap } from './src/data/stations.js'
import { calculateFare, getStationOrThrow } from './src/lib/fare.js'
import {
  flushStore,
  getStoreRuntime,
  insertBooking,
  insertPayment,
  insertTicket,
  markStoreDirty,
} from './src/lib/storage.js'
import { attachTicketQr, buildTicket } from './src/lib/ticket.js'

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
    'Select the origin and destination station on Line 1.',
    'Choose the service date, journey type, and passenger count.',
    'Authorize payment using the selected method.',
    'Receive a QR ticket and show it at the AFC gate.',
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

const metaPayload = {
  lineMeta,
  stations,
}

function todayInIst() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}

function noStore(response) {
  response.setHeader('Cache-Control', 'no-store')
}

function createRateLimiter({ windowMs, maxRequests }) {
  const hits = new Map()

  return (request, response, next) => {
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs
    const currentHits = hits.get(key)?.filter((timestamp) => timestamp > windowStart) ?? []

    currentHits.push(now)
    hits.set(key, currentHits)

    if (currentHits.length > maxRequests) {
      response.status(429).json({
        message: 'Too many write requests. Please retry shortly.',
      })
      return
    }

    next()
  }
}

await getStoreRuntime()

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST'],
  }),
)
app.use(express.json({ limit: '64kb' }))
app.use((request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'same-origin')
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  next()
})

const writeLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 240,
})

app.use((request, response, next) => {
  if (request.method !== 'POST' || request.path === '/api/fare') {
    next()
    return
  }

  writeLimiter(request, response, next)
})

app.get('/api/health', async (_request, response) => {
  const store = await getStoreRuntime()

  response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    bookings: store.data.bookings.length,
    payments: store.data.payments.length,
    tickets: store.data.tickets.length,
  })
})

app.get('/api/line1/meta', (_request, response) => {
  response.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  response.json(metaPayload)
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

    const resolvedTravelDate = travelDate ?? todayInIst()

    if (resolvedTravelDate < todayInIst()) {
      throw new Error('Travel date cannot be in the past.')
    }

    const ticketCount = Number(quantity)
    const fare = calculateFare({
      fromStationId,
      toStationId,
      journeyType,
      quantity: ticketCount,
    })

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

    await insertBooking(booking)

    noStore(response)
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
  const store = await getStoreRuntime()
  const booking = store.bookingsById.get(request.params.bookingId)

  if (!booking) {
    response.status(404).json({ message: 'Booking not found.' })
    return
  }

  noStore(response)
  response.json({
    booking,
    origin: getStationOrThrow(booking.fromStationId),
    destination: getStationOrThrow(booking.toStationId),
    payment:
      (booking.paymentId ? store.paymentsById.get(booking.paymentId) : null) ??
      store.paymentsByBookingId.get(booking.id) ??
      null,
    ticket: booking.ticketId ? store.ticketsById.get(booking.ticketId) ?? null : null,
  })
})

app.post('/api/payments/intent', async (request, response) => {
  try {
    const { bookingId } = request.body ?? {}
    const store = await getStoreRuntime()
    const booking = store.bookingsById.get(bookingId)

    if (!booking) {
      response.status(404).json({ message: 'Booking not found.' })
      return
    }

    const existingPayment = store.paymentsByBookingId.get(bookingId)

    if (existingPayment) {
      noStore(response)
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
    await insertPayment(payment)
    await markStoreDirty()

    noStore(response)
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

    const store = await getStoreRuntime()
    const payment = store.paymentsById.get(request.params.paymentId)

    if (!payment) {
      response.status(404).json({ message: 'Payment not found.' })
      return
    }

    const booking = store.bookingsById.get(payment.bookingId)

    if (!booking) {
      response.status(404).json({ message: 'Booking not found.' })
      return
    }

    if (payment.status === 'paid' && booking.ticketId) {
      const existingTicket = store.ticketsById.get(booking.ticketId)

      if (!existingTicket) {
        response.status(409).json({ message: 'Ticket record is missing for a paid booking.' })
        return
      }

      noStore(response)
      response.json({ payment, ticket: await attachTicketQr(existingTicket) })
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
    const storedTicket = await insertTicket(
      buildTicket({
        booking,
        payment,
        origin,
        destination,
        fare: booking.fare,
        baseUrl,
      }),
    )

    booking.ticketId = storedTicket.id
    await markStoreDirty()

    noStore(response)
    response.json({ payment, ticket: await attachTicketQr(storedTicket) })
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
})

app.get('/api/tickets/:ticketId', async (request, response) => {
  const store = await getStoreRuntime()
  const ticket = store.ticketsById.get(request.params.ticketId)

  if (!ticket) {
    response.status(404).json({ message: 'Ticket not found.' })
    return
  }

  const booking = store.bookingsById.get(ticket.bookingId)
  const payment = store.paymentsById.get(ticket.paymentId)

  if (!booking || !payment) {
    response.status(409).json({ message: 'Ticket references incomplete booking or payment data.' })
    return
  }

  noStore(response)
  response.json({
    ticket: await attachTicketQr(ticket),
    booking,
    payment,
    origin: stationMap.get(booking.fromStationId),
    destination: stationMap.get(booking.toStationId),
  })
})

if (fs.existsSync(frontendDistPath)) {
  app.use(
    express.static(frontendDistPath, {
      maxAge: '5m',
    }),
  )
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await flushStore()
    process.exit(0)
  })
}

app.listen(port, () => {
  console.log(`Mumbai Metro One backend running on http://localhost:${port}`)
})
