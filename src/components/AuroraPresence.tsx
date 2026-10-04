import { useEffect, useRef, useState } from 'react'
import type { AuthSession } from '../services/authService'
import { generateAuroraSpeech, speechAvailable } from '../services/speechService'

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

export function AuroraPresence({
  latestReply,
  onTranscript,
  session,
  aiBusy = false,
}: {
  latestReply?: string
  onTranscript: (text: string) => void
  session: AuthSession | null
  aiBusy?: boolean
}) {
  const recognitionRef = useRef<Recognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const playbackId = useRef(0)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const available = speechAvailable() && Boolean(session)
  const recognitionType = typeof window !== 'undefined'
    ? (window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition
    : undefined

  const stopPlayback = () => {
    playbackId.current += 1
    audioRef.current?.pause()
    audioRef.current = null
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setSpeaking(false)
    setLoading(false)
    setVoiceStatus('')
  }

  const play = async (text: string) => {
    if (!session || !available || !text.trim()) return
    stopPlayback()
    const id = playbackId.current
    setLoading(true)
    setVoiceStatus('Preparing Aurora’s voice…')
    try {
      const blob = await generateAuroraSpeech(session, text)
      if (id !== playbackId.current) return
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { if (id === playbackId.current) stopPlayback() }
      audio.onerror = () => { if (id === playbackId.current) { stopPlayback(); setVoiceStatus('Audio could not play on this device.') } }
      await audio.play()
      if (id === playbackId.current) {
        setLoading(false)
        setSpeaking(true)
        setVoiceStatus('')
      }
    } catch (error) {
      if (id === playbackId.current) {
        stopPlayback()
        setVoiceStatus(error instanceof Error ? error.message : 'Aurora’s voice is unavailable.')
      }
    }
  }

  useEffect(() => () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    playbackId.current += 1
    audioRef.current?.pause()
    audioRef.current = null
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
  }, [])

  useEffect(() => () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
    playbackId.current += 1
    audioRef.current?.pause()
    audioRef.current = null
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setSpeaking(false)
    setLoading(false)
    setVoiceStatus('')
  }, [session?.user.id])

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
    recognition.onerror = () => { setListening(false); setVoiceStatus('Microphone unavailable. You can type instead.') }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    try { recognition.start(); setListening(true); setVoiceStatus('Listening…') }
    catch { setVoiceStatus('Microphone unavailable. You can type instead.') }
  }

  return (
    <div className="aurora-presence aurora-presence-premium">
      <div className="aurora-portrait-card">
        <img
          className="aurora-live-portrait"
          src={`${import.meta.env.BASE_URL}aurora-portrait.webp`}
          alt="Aurora, a fictional adult AI companion"
        />
        <div className="aurora-live-badge" aria-live="polite">
          <span className={aiBusy || externalAiBusy ? 'aurora-status-dot busy' : 'aurora-status-dot'} />
          {aiBusy || externalAiBusy ? 'Aurora is thinking' : speaking ? 'Aurora is speaking' : listening ? 'Listening' : 'Aurora'}
        </div>
      </div>

      <div className="aurora-presence-copy">
        <p className="eyebrow">AURORA</p>
        <h2>Talk naturally. Hear her reply.</h2>
        <p className="small">Aurora is an AI companion. Chat is private to your account, and voice is optional.</p>
        <div className="voice-controls">
          <button type="button" onClick={toggleListening} disabled={!recognitionType} aria-pressed={listening}>
            {listening ? 'Stop listening' : 'Speak a message'}
          </button>
          <button type="button" onClick={() => speaking || loading ? stopPlayback() : void play(VOICE_SAMPLE)} disabled={!available} aria-pressed={speaking}>
            {loading ? 'Stop loading' : speaking ? 'Stop voice' : 'Hear Aurora'}
          </button>
          <button type="button" onClick={() => speaking || loading ? stopPlayback() : latestReply && void play(latestReply)} disabled={!available || !latestReply} aria-pressed={speaking}>
            {speaking || loading ? 'Stop voice' : 'Hear latest reply'}
          </button>
        </div>
        {!available && <p className="small">Sign in and complete adult verification to enable Aurora’s generated voice.</p>}
        {!recognitionType && <p className="small">Microphone input is unavailable in this browser. You can type instead.</p>}
        {voiceStatus && <p className="small" role="status">{voiceStatus}</p>}
      </div>
    </div>
  )
}
