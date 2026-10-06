import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'

const MAX_SPEECH_CHARS = 1500
const SPEECH_TIMEOUT_MS = 30_000

export const speechAvailable = () => {
  const config = readCloudConfig()
  return Boolean(config.supabaseUrl && config.supabaseAnonKey && import.meta.env.VITE_AURORA_SPEECH_ENABLED === 'true')
}

const speechError = async (response: Response) => {
  const payload = await response.json().catch(() => null)
  if (response.status === 401) return 'Your session has expired. Please sign in again.'
  if (response.status === 403) return payload?.error || 'Complete adult verification to use Aurora’s generated voice.'
  if (response.status === 429) return payload?.error || 'Aurora’s voice limit has been reached. Please try again shortly.'
  return payload?.error || 'Aurora’s voice is unavailable. Please try again.'
}

export const generateAuroraSpeech = async (session: AuthSession, text: string): Promise<Blob> => {
  const config = readCloudConfig()
  const cleanText = text.trim().slice(0, MAX_SPEECH_CHARS)
  if (!cleanText) throw new Error('There is no text for Aurora to speak.')
  if (!speechAvailable()) throw new Error('Aurora’s voice is not configured yet.')

  const active = await ensureFreshSession(session)
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), SPEECH_TIMEOUT_MS)

  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/speak`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + active.accessToken,
        apikey: config.supabaseAnonKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text: cleanText }),
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(await speechError(response))
    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.toLowerCase().includes('audio/mpeg')) throw new Error('Aurora returned an invalid voice response.')
    const blob = await response.blob()
    if (!blob.size) throw new Error('Aurora returned an empty voice response.')
    return blob
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Aurora’s voice took too long to respond. Please try again.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
