import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'

export const speechAvailable = () => {
  const config = readCloudConfig()
  return Boolean(config.supabaseUrl && config.supabaseAnonKey && import.meta.env.VITE_AURORA_SPEECH_ENABLED === 'true')
}

export const generateAuroraSpeech = async (session: AuthSession, text: string): Promise<Blob> => {
  const config = readCloudConfig()
  if (!speechAvailable()) throw new Error('Aurora’s voice is not configured yet.')
  const active = await ensureFreshSession(session)
  const response = await fetch(`${config.supabaseUrl}/functions/v1/speak`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + active.accessToken, apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, 1500) }),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.error || 'Aurora’s voice is unavailable. Please try again.')
  }
  if (!response.headers.get('Content-Type')?.includes('audio/mpeg')) throw new Error('Invalid voice response.')
  return response.blob()
}
