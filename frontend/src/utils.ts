import type { JourneyType } from './types'

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export function todayAsInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export function formatJourneyType(journeyType: JourneyType) {
  return journeyType === 'rjt' ? 'RJT' : 'SJT'
}
