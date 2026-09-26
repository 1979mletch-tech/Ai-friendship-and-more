export const redactForLog = (value: string) =>
  value
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED]')
    .replace(/(?:api[_-]?key|token|password|secret)\s*[:=]\s*[^\s,;]+/gi, (match) => match.split(/[:=]/)[0] + '=[REDACTED]')
    .slice(0, 500)

export const safeErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) return 'Unexpected error.'
  const clean = redactForLog(error.message)
  return clean || 'Unexpected error.'
}
