import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'

const MAX_SPEECH_CHARS = 1500
const SPEECH_TIMEOUT_MS = 30_000

export const speechAvailable = (): boolean => {
  const config = readCloudConfig()
  return Boolean(config.supabaseUrl && config.supabaseAnonKey && import.meta.env.VITE_AURORA_SPEECH_ENABLED === 'true')
}

export const browserSpeechAvailable = (): boolean => {
  if (typeof window === 'undefined') return false
  const hasSynth = 'speechSynthesis' in window && Boolean(window.speechSynthesis)
  const hasUtterance = 'SpeechSynthesisUtterance' in window || typeof SpeechSynthesisUtterance !== 'undefined'
  return hasSynth && hasUtterance
}

export const anySpeechAvailable = (): boolean => {
  return speechAvailable() || browserSpeechAvailable()
}

export const getFeminineSpanishOrGentleVoice = (): SpeechSynthesisVoice | null => {
  if (!browserSpeechAvailable()) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices || voices.length === 0) return null

  // Priority 1: Spanish / Latin American feminine voice
  const spanishFem = voices.find((v) => {
    const lang = v.lang.toLowerCase()
    const name = v.name.toLowerCase()
    const isSpanish = lang.startsWith('es')
    const isFeminine = /paulina|monica|mónica|victoria|helena|laura|sabina|sofia|sofía|rosa|francisca|luciana|paloma|dalia|elvira|female|femme/.test(name)
    return isSpanish && isFeminine
  })
  if (spanishFem) return spanishFem

  // Priority 2: Any Spanish voice
  const spanishAny = voices.find((v) => v.lang.toLowerCase().startsWith('es'))
  if (spanishAny) return spanishAny

  // Priority 3: Calm feminine English / natural voice
  const englishFem = voices.find((v) => {
    const lang = v.lang.toLowerCase()
    const name = v.name.toLowerCase()
    const isEnglish = lang.startsWith('en')
    const isFeminine = /samantha|karen|victoria|moira|fiona|serena|stephanie|susan|zira|female|natural/.test(name)
    return isEnglish && isFeminine
  })
  if (englishFem) return englishFem

  // Priority 4: Default voice
  return voices.find((v) => v.default) || voices[0] || null
}

export type BrowserSpeechOptions = {
  voice?: SpeechSynthesisVoice | null
  rate?: number
  pitch?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
  onPause?: () => void
  onResume?: () => void
}

export type BrowserSpeechHandle = {
  pause: () => void
  resume: () => void
  stop: () => void
}

export const speakWithBrowserSynthesis = (
  text: string,
  options: BrowserSpeechOptions = {},
): BrowserSpeechHandle => {
  if (!browserSpeechAvailable()) {
    throw new Error('In-browser speech synthesis is not supported on this device.')
  }
  const synth = window.speechSynthesis
  try {
    synth.cancel()
  } catch {
    // ignore cancel errors
  }

  const cleanText = text.trim().slice(0, MAX_SPEECH_CHARS)
  if (!cleanText) throw new Error('There is no text for Aurora to speak.')

  const UtteranceConstructor = (window as unknown as { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance }).SpeechSynthesisUtterance
    ?? (typeof SpeechSynthesisUtterance !== 'undefined' ? SpeechSynthesisUtterance : null)
  if (!UtteranceConstructor) {
    throw new Error('In-browser speech synthesis is not supported on this device.')
  }

  const utterance = new UtteranceConstructor(cleanText)
  const voice = options.voice ?? getFeminineSpanishOrGentleVoice()
  if (voice) utterance.voice = voice

  // Calm, gentle, warm feminine delivery
  utterance.rate = options.rate ?? 0.92
  utterance.pitch = options.pitch ?? 1.04

  if (options.onStart) utterance.onstart = () => options.onStart?.()
  if (options.onEnd) utterance.onend = () => options.onEnd?.()
  if (options.onPause) utterance.onpause = () => options.onPause?.()
  if (options.onResume) utterance.onresume = () => options.onResume?.()
  utterance.onerror = (e) => {
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      options.onError?.(new Error(`Device speech error: ${e.error}`))
    } else {
      options.onEnd?.()
    }
  }

  synth.speak(utterance)

  return {
    pause: () => {
      try {
        if (synth.speaking && !synth.paused) synth.pause()
        options.onPause?.()
      } catch {
        // ignore
      }
    },
    resume: () => {
      try {
        if (synth.paused) synth.resume()
        options.onResume?.()
      } catch {
        // ignore
      }
    },
    stop: () => {
      try {
        synth.cancel()
      } catch {
        // ignore
      }
      options.onEnd?.()
    },
  }
}

const speechError = async (response: Response) => {
  const payload = await response.json().catch(() => null)
  if (response.status === 401) return 'Your session has expired. Please sign in again.'
  if (response.status === 403) return payload?.error || 'Complete adult verification to use Aurora’s generated voice.'
  if (response.status === 429) return payload?.error || 'Aurora’s voice limit has been reached. Please try again shortly.'
  return payload?.error || 'Aurora’s voice is unavailable. Please try again.'
}

export const generateAuroraSpeech = async (session: AuthSession, text: string, voice?: string): Promise<Blob> => {
  const config = readCloudConfig()
  const cleanText = text.trim().slice(0, MAX_SPEECH_CHARS)
  if (!cleanText) throw new Error('There is no text for Aurora to speak.')
  if (!speechAvailable()) throw new Error('Aurora’s voice is not configured yet.')

  const active = await ensureFreshSession(session)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SPEECH_TIMEOUT_MS)

  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/speak`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + active.accessToken,
        apikey: config.supabaseAnonKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text: cleanText, ...(voice ? { voice } : {}) }),
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
