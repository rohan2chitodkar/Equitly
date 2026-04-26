export function formatCurrency(amount, currency = 'INR', locale = 'en-IN') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date))
}

export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export const CATEGORY_EMOJI = {
  food: '🍔',
  travel: '✈️',
  house: '🏠',
  entertainment: '🎬',
  shopping: '🛍️',
  utilities: '💡',
  health: '🏥',
  other: '📌'
}

export const CATEGORY_COLORS = {
  food: '#fff3e0',
  travel: '#e8f4fd',
  house: '#f0fdf4',
  entertainment: '#fdf4ff',
  shopping: '#fff1f2',
  utilities: '#fef9e6',
  health: '#e8fdf4',
  other: '#f5f4f0'
}
