export const normalizeUserText = (value: string, maxLength = 2000) =>
  value.replace(/\u0000/g, '').trim().slice(0, maxLength)

export const normalizeDisplayName = (value: string, fallback = 'Friend') => {
  const clean = value.replace(/[<>\u0000]/g, '').replace(/\s+/g, ' ').trim().slice(0, 32)
  return clean || fallback
}

export const isReasonableEmail = (value: string) =>
  value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
