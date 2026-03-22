import { performance } from 'node:perf_hooks'

const baseUrl = process.env.BASE_URL ?? 'http://localhost:4000'
const durationMs = Number(process.env.PERF_DURATION_MS ?? 3000)
const concurrency = Number(process.env.PERF_CONCURRENCY ?? 40)

function percentile(values, ratio) {
  if (!values.length) {
    return 0
  }

  const sortedValues = [...values].sort((left, right) => left - right)
  const index = Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * ratio))
  return sortedValues[index]
}

async function requestJson(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options)

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  await response.text()
}

async function runScenario(name, requestFactory) {
  const startedAt = performance.now()
  const latencies = []
  let successes = 0
  let failures = 0

  async function worker() {
    while (performance.now() - startedAt < durationMs) {
      const requestStartedAt = performance.now()

      try {
        await requestFactory()
        successes += 1
        latencies.push(performance.now() - requestStartedAt)
      } catch {
        failures += 1
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  const elapsedSeconds = (performance.now() - startedAt) / 1000
  const totalRequests = successes + failures

  console.log(
    `${name}: total=${totalRequests} ok=${successes} failed=${failures} rps=${(
      totalRequests / elapsedSeconds
    ).toFixed(1)} p95=${percentile(latencies, 0.95).toFixed(1)}ms`,
  )
}

await requestJson('/api/health')

console.log(`Running perf smoke against ${baseUrl} for ${durationMs}ms with concurrency ${concurrency}`)

await runScenario('meta', () => requestJson('/api/line1/meta'))
await runScenario('fare', () =>
  requestJson('/api/fare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fromStationId: 'versova',
      toStationId: 'ghatkopar',
      journeyType: 'sjt',
      quantity: 2,
    }),
  }),
)
