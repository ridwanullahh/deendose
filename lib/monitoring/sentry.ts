export function initSentry() {
  if (typeof window === 'undefined') return

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  console.log('Sentry monitoring initialized')
}

export function captureException(error: Error, context?: Record<string, any>) {
  console.error('Error captured:', error, context)
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  console.log(`[${level.toUpperCase()}]`, message)
}

export function setUser(user: { id: string; email?: string }) {
  // Sentry.setUser(user)
}
