import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const storePath = path.resolve(__dirname, '../../data/store.json')

const defaultStore = {
  bookings: [],
  payments: [],
  tickets: [],
}

export async function readStore() {
  try {
    const rawStore = await fs.readFile(storePath, 'utf8')
    const parsedStore = JSON.parse(rawStore)

    return {
      bookings: parsedStore.bookings ?? [],
      payments: parsedStore.payments ?? [],
      tickets: parsedStore.tickets ?? [],
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeStore(defaultStore)
      return structuredClone(defaultStore)
    }

    throw error
  }
}

export async function writeStore(store) {
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
}
