import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  anySpeechAvailable,
  browserSpeechAvailable,
  generateAuroraSpeech,
  getFeminineSpanishOrGentleVoice,
  speakWithBrowserSynthesis,
  speechAvailable,
} from './speechService'
import type { AuthSession } from './authService'

const mockSession: AuthSession = {
  accessToken: 'test-access-token',
  expiresAt: Date.now() + 3_600_000,
  refreshToken: 'test-refresh-token',
  user: {
    id: 'user-123',
    email: 'aurora-tester@example.com',
  },
}

describe('speechService', () => {
  const originalWindow = (globalThis as { window?: unknown }).window

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    Object.defineProperty(globalThis, 'window', {
      value: {
        ...((originalWindow as object) || {}),
        setTimeout,
        clearTimeout,
        speechSynthesis: undefined,
        SpeechSynthesisUtterance: undefined,
      },
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window
    } else {
      Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true, writable: true })
    }
  })

  describe('speechAvailable and browserSpeechAvailable', () => {
    it('returns false when cloud speech env is not set', () => {
      expect(speechAvailable()).toBe(false)
    })

    it('reports browserSpeechAvailable correctly based on window object', () => {
      const win = window as any
      win.speechSynthesis = {}
      win.SpeechSynthesisUtterance = function () {}
      expect(browserSpeechAvailable()).toBe(true)
      expect(anySpeechAvailable()).toBe(true)

      delete win.speechSynthesis
      expect(browserSpeechAvailable()).toBe(false)
    })
  })

  describe('getFeminineSpanishOrGentleVoice', () => {
    it('selects Spanish feminine voice with priority when available', () => {
      const mockVoices = [
        { name: 'Alex', lang: 'en-US', default: true },
        { name: 'Jorge', lang: 'es-ES', default: false },
        { name: 'Paulina', lang: 'es-MX', default: false },
        { name: 'Samantha', lang: 'en-US', default: false },
      ] as SpeechSynthesisVoice[]

      const win = window as any
      win.speechSynthesis = {
        getVoices: () => mockVoices,
      }
      win.SpeechSynthesisUtterance = function () {}

      const selected = getFeminineSpanishOrGentleVoice()
      expect(selected?.name).toBe('Paulina')
    })

    it('falls back to calm feminine English voice when Spanish voice is absent', () => {
      const mockVoices = [
        { name: 'Alex', lang: 'en-US', default: false },
        { name: 'Samantha', lang: 'en-US', default: false },
      ] as SpeechSynthesisVoice[]

      const win = window as any
      win.speechSynthesis = {
        getVoices: () => mockVoices,
      }
      win.SpeechSynthesisUtterance = function () {}

      const selected = getFeminineSpanishOrGentleVoice()
      expect(selected?.name).toBe('Samantha')
    })
  })

  describe('speakWithBrowserSynthesis', () => {
    it('configures rate 0.92, pitch 1.04, and triggers callbacks', () => {
      let spokenUtterance: any = null
      let cancelCalled = false
      let paused = false

      const win = window as any
      win.speechSynthesis = {
        speaking: true,
        paused: false,
        getVoices: () => [{ name: 'Paulina', lang: 'es-MX' } as SpeechSynthesisVoice],
        cancel: () => { cancelCalled = true },
        pause: () => {
          paused = true
        },
        resume: () => {
          paused = false
        },
        speak: (utterance: any) => {
          spokenUtterance = utterance
          utterance.onstart?.()
        },
      }
      win.SpeechSynthesisUtterance = function (this: any, text: string) {
        this.text = text
      }

      const onStart = vi.fn()
      const handle = speakWithBrowserSynthesis('Hello Aurora, nice to meet you.', { onStart })

      expect(cancelCalled).toBe(true)
      expect(onStart).toHaveBeenCalled()
      expect(spokenUtterance).not.toBeNull()
      expect(spokenUtterance?.rate).toBe(0.92)
      expect(spokenUtterance?.pitch).toBe(1.04)

      handle.pause()
      expect(paused).toBe(true)
      handle.resume()
      expect(paused).toBe(false)
      handle.stop()
    })
  })

  describe('generateAuroraSpeech', () => {
    it('throws when text is empty', async () => {
      await expect(generateAuroraSpeech(mockSession, '   ')).rejects.toThrow('There is no text for Aurora to speak.')
    })

    it('throws when cloud speech is not configured', async () => {
      await expect(generateAuroraSpeech(mockSession, 'Hello Aurora')).rejects.toThrow('Aurora’s voice is not configured yet.')
    })

    it('successfully calls edge function and returns audio Blob when configured', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://aurora.supabase.co')
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-test-key')
      vi.stubEnv('VITE_AURORA_SPEECH_ENABLED', 'true')

      const mockBlob = new Blob(['fake-audio-bytes'], { type: 'audio/mpeg' })
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
        blob: async () => mockBlob,
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await generateAuroraSpeech(mockSession, 'Hello Aurora')
      expect(result).toBe(mockBlob)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://aurora.supabase.co/functions/v1/speak',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer ' + mockSession.accessToken,
            apikey: 'anon-test-key',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ text: 'Hello Aurora' }),
        }),
      )
    })

    it('handles 401 session expiration error', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://aurora.supabase.co')
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-test-key')
      vi.stubEnv('VITE_AURORA_SPEECH_ENABLED', 'true')

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await expect(generateAuroraSpeech(mockSession, 'Hello Aurora')).rejects.toThrow('Your session has expired. Please sign in again.')
    })

    it('handles 403 adult verification error', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://aurora.supabase.co')
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-test-key')
      vi.stubEnv('VITE_AURORA_SPEECH_ENABLED', 'true')

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Adult eligibility verification required' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await expect(generateAuroraSpeech(mockSession, 'Hello Aurora')).rejects.toThrow('Adult eligibility verification required')
    })

    it('handles 429 rate limit error', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://aurora.supabase.co')
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-test-key')
      vi.stubEnv('VITE_AURORA_SPEECH_ENABLED', 'true')

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too many requests. Please wait a moment.' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await expect(generateAuroraSpeech(mockSession, 'Hello Aurora')).rejects.toThrow('Too many requests. Please wait a moment.')
    })
  })
})
