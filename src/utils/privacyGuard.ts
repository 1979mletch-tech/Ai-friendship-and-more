const sensitiveKeys=/^(password|accessToken|refreshToken|apiKey|secret|authorization)$/i
export const stripSensitiveFields = (value:unknown):unknown => {
  if(Array.isArray(value)) return value.map(stripSensitiveFields)
  if(value&&typeof value==='object') return Object.fromEntries(Object.entries(value as Record<string,unknown>).filter(([k])=>!sensitiveKeys.test(k)).map(([k,v])=>[k,stripSensitiveFields(v)]))
  return value
}
export const safeAnalyticsEvent = (name:string) => name.replace(/[^a-z0-9_.-]/gi,'').slice(0,64)
