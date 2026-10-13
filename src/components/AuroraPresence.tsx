import { useEffect, useRef, useState } from 'react'
import type { AuthSession } from '../services/authService'
import {
  browserSpeechAvailable,
  generateAuroraSpeech,
  speakWithBrowserSynthesis,
  speechAvailable,
  type BrowserSpeechHandle,
} from '../services/speechService'

const VOICE_SAMPLE = "Hi, I'm Aurora. It's lovely to meet you. What shall we talk about?"

type RecognitionResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> }
type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: RecognitionResult) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type RecognitionConstructor = new () => Recognition

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused'
type AudioSource = 'cloud' | 'device' | null

export function AuroraPresence({ latestReply, onTranscript, session, aiBusy = false }: {
  latestReply?: string
  onTranscript: (text: string) => void
  session: AuthSession | null
  aiBusy?: boolean
}) {
  const recognitionRef = useRef<Recognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const browserSpeechHandleRef = useRef<BrowserSpeechHandle | null>(null)
  const playbackId = useRef(0)
  const lastSpokenTextRef = useRef<string>('')
  const activeSourceRef = useRef<AudioSource>(null)

  const [listening, setListening] = useState(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [voiceStatus, setVoiceStatus] = useState('')
  const [lastSpoken, setLastSpoken] = useState('')

  const cloudEnabled = speechAvailable() && Boolean(session)
  const deviceEnabled = browserSpeechAvailable()
  const canSpeak = cloudEnabled || deviceEnabled

  const recognitionType = typeof window !== 'undefined'
    ? (window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition
    : undefined

  const clearAudioElements = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current = null
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    if (browserSpeechHandleRef.current) {
      browserSpeechHandleRef.current.stop()
      browserSpeechHandleRef.current = null
    }
    activeSourceRef.current = null
  }

  const stopPlayback = (clearStatus = true) => {
    playbackId.current += 1
    clearAudioElements()
    setPlaybackState('idle')
    if (clearStatus) setVoiceStatus('')
  }

  const pausePlayback = () => {
    if (playbackState !== 'playing') return
    if (activeSourceRef.current === 'cloud' && audioRef.current) {
      audioRef.current.pause()
      setPlaybackState('paused')
      setVoiceStatus('Voice paused.')
    } else if (activeSourceRef.current === 'device' && browserSpeechHandleRef.current) {
      browserSpeechHandleRef.current.pause()
      setPlaybackState('paused')
      setVoiceStatus('Voice paused.')
    }
  }

  const resumePlayback = () => {
    if (playbackState !== 'paused') return
    if (activeSourceRef.current === 'cloud' && audioRef.current) {
      audioRef.current.play().then(() => {
        setPlaybackState('playing')
        setVoiceStatus('Aurora is speaking.')
      }).catch(() => {
        stopPlayback()
        setVoiceStatus('Audio could not resume on this device.')
      })
    } else if (activeSourceRef.current === 'device' && browserSpeechHandleRef.current) {
      browserSpeechHandleRef.current.resume()
      setPlaybackState('playing')
      setVoiceStatus('Aurora is speaking.')
    }
  }

  const replayPlayback = () => {
    const textToReplay = lastSpokenTextRef.current || latestReply || VOICE_SAMPLE
    if (textToReplay) {
      void play(textToReplay)
    }
  }

  const playWithDeviceSynthesis = (text: string, id: number, initialStatus?: string) => {
    try {
      activeSourceRef.current = 'device'
      setPlaybackState('playing')
      setVoiceStatus(initialStatus || 'Aurora is speaking.')
      const handle = speakWithBrowserSynthesis(text, {
        onStart: () => {
          if (id === playbackId.current) {
            setPlaybackState('playing')
            setVoiceStatus('Aurora is speaking.')
          }
        },
        onEnd: () => {
          if (id === playbackId.current) {
            clearAudioElements()
            setPlaybackState('idle')
            setVoiceStatus('')
          }
        },
        onError: (err) => {
          if (id === playbackId.current) {
            clearAudioElements()
            setPlaybackState('idle')
            setVoiceStatus(err.message || 'Device voice error.')
          }
        },
        onPause: () => {
          if (id === playbackId.current) {
            setPlaybackState('paused')
            setVoiceStatus('Voice paused.')
          }
        },
        onResume: () => {
          if (id === playbackId.current) {
            setPlaybackState('playing')
            setVoiceStatus('Aurora is speaking.')
          }
        },
      })
      browserSpeechHandleRef.current = handle
    } catch (err) {
      if (id === playbackId.current) {
        clearAudioElements()
        setPlaybackState('idle')
        setVoiceStatus(err instanceof Error ? err.message : 'Could not play audio.')
      }
    }
  }

  const play = async (text: string) => {
    const clean = text.trim()
    if (!clean) return
    lastSpokenTextRef.current = clean
    setLastSpoken(clean)
    stopPlayback(false)

    const id = ++playbackId.current

    // Try cloud speech first if available and user is authenticated
    if (cloudEnabled && session) {
      setPlaybackState('loading')
      setVoiceStatus('Preparing Aurora’s voice…')
      try {
        const blob = await generateAuroraSpeech(session, clean)
        if (id !== playbackId.current) return
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        const audio = new Audio(url)
        audio.preload = 'auto'
        audioRef.current = audio
        activeSourceRef.current = 'cloud'

        audio.onended = () => {
          if (id !== playbackId.current) return
          clearAudioElements()
          setPlaybackState('idle')
          setVoiceStatus('')
        }
        audio.onerror = () => {
          if (id !== playbackId.current) return
          clearAudioElements()
          // Fall back to device speech if browser speech is available
          if (deviceEnabled) {
            playWithDeviceSynthesis(clean, id, 'Audio playback failed. Playing with device voice.')
          } else {
            setPlaybackState('idle')
            setVoiceStatus('Audio could not play on this device. Check media volume and try again.')
          }
        }

        await audio.play()
        if (id === playbackId.current) {
          setPlaybackState('playing')
          setVoiceStatus('Aurora is speaking.')
        }
        return
      } catch (error) {
        if (id !== playbackId.current) return
        clearAudioElements()
        // If cloud speech fails, gracefully fall back to device speech if available
        if (deviceEnabled) {
          const reason = error instanceof Error ? error.message : 'Cloud voice unavailable'
          playWithDeviceSynthesis(clean, id, `Aurora speaking with device voice (${reason}).`)
          return
        }
        setPlaybackState('idle')
        setVoiceStatus(error instanceof Error ? error.message : 'Aurora’s voice is unavailable.')
        return
      }
    }

    // If cloud speech is not available, use device speech synthesis
    if (deviceEnabled) {
      playWithDeviceSynthesis(clean, id)
      return
    }

    setVoiceStatus('Voice is not supported in this browser. Please try another browser.')
  }

  useEffect(() => () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    playbackId.current += 1
    clearAudioElements()
  }, [])

  const userId = session?.user.id
  const prevUserIdRef = useRef(userId)
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setListening(false)
      stopPlayback()
    }
  }, [userId])

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    if (!recognitionType) return
    const recognition = new recognitionType()
    recognition.lang = navigator.language || 'en-GB'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim()
      if (transcript) {
        onTranscript(transcript)
        setVoiceStatus('Voice draft added. Review it before sending.')
      }
    }
    recognition.onerror = () => {
      setListening(false)
      setVoiceStatus('Microphone unavailable. You can type instead.')
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
      setVoiceStatus('Listening…')
    } catch {
      setVoiceStatus('Microphone unavailable. You can type instead.')
    }
  }

  const isSpeaking = playbackState === 'playing'
  const isLoading = playbackState === 'loading'
  const isPaused = playbackState === 'paused'

  return (
    <div className="aurora-presence aurora-presence-premium">
      <div className={`aurora-portrait-card ${isSpeaking ? 'is-speaking' : ''} ${isPaused ? 'is-paused' : ''}`}>
        <img
          className="aurora-live-portrait"
          src={`${import.meta.env.BASE_URL}aurora-portrait.webp`}
          alt="Aurora, a fictional adult AI companion"
        />
        <div className="aurora-live-badge" aria-live="polite">
          <span
            className={
              aiBusy
                ? 'aurora-status-dot busy'
                : isSpeaking
                  ? 'aurora-status-dot speaking'
                  : 'aurora-status-dot'
            }
          />
          {aiBusy
            ? 'Aurora is thinking'
            : isLoading
              ? 'Preparing voice…'
              : isSpeaking
                ? 'Aurora is speaking'
                : isPaused
                  ? 'Voice paused'
                  : listening
                    ? 'Listening'
                    : 'Aurora'}
        </div>
      </div>

      <div className="aurora-presence-copy">
        <p className="eyebrow">AURORA</p>
        <h2>Talk naturally. Hear her reply.</h2>
        <p className="small">Aurora is an AI companion. Chat is private to your account, and voice is optional.</p>

        <div className="voice-controls" role="group" aria-label="Voice playback controls">
          <button
            type="button"
            onClick={toggleListening}
            disabled={!recognitionType || aiBusy}
            aria-pressed={listening}
          >
            {listening ? 'Stop listening' : 'Speak a message'}
          </button>

          {isLoading && (
            <button type="button" onClick={() => stopPlayback()}>
              Stop loading
            </button>
          )}

          {isSpeaking && (
            <>
              <button type="button" onClick={pausePlayback} aria-label="Pause voice playback">
                Pause voice
              </button>
              <button type="button" onClick={() => stopPlayback()} aria-label="Stop voice playback">
                Stop voice
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button type="button" onClick={resumePlayback} aria-label="Resume voice playback">
                Resume voice
              </button>
              <button type="button" onClick={replayPlayback} aria-label="Replay voice from beginning">
                Replay voice
              </button>
              <button type="button" onClick={() => stopPlayback()} aria-label="Stop voice playback">
                Stop voice
              </button>
            </>
          )}

          {!isLoading && !isSpeaking && !isPaused && (
            <>
              <button
                type="button"
                onClick={() => void play(VOICE_SAMPLE)}
                disabled={!canSpeak || aiBusy}
              >
                Hear Aurora
              </button>
              <button
                type="button"
                onClick={() => latestReply && void play(latestReply)}
                disabled={!canSpeak || !latestReply || aiBusy}
              >
                Hear latest reply
              </button>
              {Boolean(lastSpoken) && (
                <button
                  type="button"
                  onClick={replayPlayback}
                  disabled={!canSpeak || aiBusy}
                  aria-label="Replay last spoken message"
                >
                  Replay voice
                </button>
              )}
            </>
          )}
        </div>

        {!canSpeak && (
          <p className="small">Sign in and complete adult verification to enable Aurora’s generated voice.</p>
        )}
        {canSpeak && !cloudEnabled && deviceEnabled && (
          <p className="small">Device voice preview active. Sign in with adult verification for natural cloud voice.</p>
        )}
        {!recognitionType && (
          <p className="small">Microphone input is unavailable in this browser. You can type instead.</p>
        )}
        {voiceStatus && (
          <p className="small" role="status" aria-live="polite">
            {voiceStatus}
          </p>
        )}
      </div>
    </div>
  )
}
