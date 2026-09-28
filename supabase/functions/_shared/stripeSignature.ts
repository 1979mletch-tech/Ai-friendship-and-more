export const validStripeSignature = async (payload: string, signature: string, secret: string, now = Date.now()) => {
  const parts = signature.split(',').map((part) => part.trim().split('='))
  const timestamp = parts.find(([key]) => key === 't')?.[1]
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value)
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300 ||
      !secret || signatures.length === 0) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`)))
  const expected = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return signatures.some((value) => {
    if (!value || value.length !== expected.length) return false
    let difference = 0
    for (let i = 0; i < value.length; i++) difference |= value.charCodeAt(i) ^ expected.charCodeAt(i)
    return difference === 0
  })
}
