import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const storePath = path.resolve(__dirname, '../../data/store.json')
const persistDelayMs = 150

const defaultStore = {
  bookings: [],
  payments: [],
  tickets: [],
}

const runtime = {
  data: structuredClone(defaultStore),
  bookingsById: new Map(),
  paymentsById: new Map(),
  paymentsByBookingId: new Map(),
  ticketsById: new Map(),
}

let loadPromise = null
let persistTimer = null
let persistQueued = false
let persistChain = Promise.resolve()

function sanitizeTicket(ticket) {
  const { qrCodeDataUrl, ...safeTicket } = ticket ?? {}
  return safeTicket
}

function normalizeStore(parsedStore) {
  return {
    bookings: Array.isArray(parsedStore?.bookings) ? parsedStore.bookings : [],
    payments: Array.isArray(parsedStore?.payments) ? parsedStore.payments : [],
    tickets: Array.isArray(parsedStore?.tickets)
      ? parsedStore.tickets.map((ticket) => sanitizeTicket(ticket))
      : [],
  }
}

function rebuildIndexes() {
  runtime.bookingsById = new Map(runtime.data.bookings.map((booking) => [booking.id, booking]))
  runtime.paymentsById = new Map(runtime.data.payments.map((payment) => [payment.id, payment]))
  runtime.paymentsByBookingId = new Map(
    runtime.data.payments.map((payment) => [payment.bookingId, payment]),
  )
  runtime.ticketsById = new Map(runtime.data.tickets.map((ticket) => [ticket.id, ticket]))
}

async function writeSnapshot(snapshot) {
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  const tempStorePath = `${storePath}.tmp`
  await fs.writeFile(tempStorePath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  await fs.rm(storePath, { force: true })
  await fs.rename(tempStorePath, storePath)
}

async function queuePersist() {
  if (!persistQueued) {
    return persistChain
  }

  persistQueued = false
  const snapshot = structuredClone(runtime.data)

  persistChain = persistChain.then(() => writeSnapshot(snapshot))
  await persistChain
  return persistChain
}

function schedulePersist() {
  persistQueued = true

  if (persistTimer) {
    return
  }

  persistTimer = setTimeout(() => {
    persistTimer = null
    void queuePersist()
  }, persistDelayMs)
}

async function ensureLoaded() {
  if (loadPromise) {
    await loadPromise
    return runtime
  }

  loadPromise = (async () => {
    try {
      const rawStore = await fs.readFile(storePath, 'utf8')
      runtime.data = normalizeStore(JSON.parse(rawStore))
    } catch (error) {
      if (error.code === 'ENOENT') {
        runtime.data = structuredClone(defaultStore)
        await writeSnapshot(runtime.data)
      } else {
        throw error
      }
    }

    rebuildIndexes()
    return runtime
  })()

  await loadPromise
  return runtime
}

export async function getStoreRuntime() {
  return ensureLoaded()
}

export async function insertBooking(booking) {
  const store = await ensureLoaded()
  store.data.bookings.push(booking)
  store.bookingsById.set(booking.id, booking)
  schedulePersist()
  return booking
}

export async function insertPayment(payment) {
  const store = await ensureLoaded()
  store.data.payments.push(payment)
  store.paymentsById.set(payment.id, payment)
  store.paymentsByBookingId.set(payment.bookingId, payment)
  schedulePersist()
  return payment
}

export async function insertTicket(ticket) {
  const store = await ensureLoaded()
  const sanitizedTicket = sanitizeTicket(ticket)
  store.data.tickets.push(sanitizedTicket)
  store.ticketsById.set(sanitizedTicket.id, sanitizedTicket)
  schedulePersist()
  return sanitizedTicket
}

export async function markStoreDirty() {
  await ensureLoaded()
  schedulePersist()
}

export async function flushStore() {
  await ensureLoaded()

  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }

  await queuePersist()
}
