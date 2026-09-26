const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

export const hashCredential = async (email: string, password: string): Promise<string> => {
  const normalizedEmail = email.trim().toLowerCase()
  const payload = `${normalizedEmail}::ai-doctor::${password}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  return toHex(digest)
}
