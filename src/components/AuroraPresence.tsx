import { useEffect, useRef, useState } from 'react'
import type { AuthSession } from '../services/authService'
import { generateAuroraSpeech, speechAvailable } from '../services/speechService'

const VOICE_SAMPLE = "Hello, I'm Aurora. Take your time. What's on your mind today?"

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

export function AuroraPresence({ latestReply, onTranscript, session }: { latestReply?: string; onTranscript: (text: string) => void; session: AuthSession | null }) {
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
  }

  useEffect(() => () => {
    recognitionRef.current?.stop()
    playbackId.current += 1
    audioRef.current?.pause()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])
  useEffect(() => () => {
    playbackId.current += 1
    audioRef.current?.pause()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
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

  const play = async (text: string) => {
    if (!session || !available) return
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
      if (id === playbackId.current) { setLoading(false); setSpeaking(true); setVoiceStatus('') }
    } catch (error) {
      if (id === playbackId.current) { stopPlayback(); setVoiceStatus(error instanceof Error ? error.message : 'Aurora’s voice is unavailable.') }
    }
  }

  return (
    <div className="aurora-presence">
      <img src={`${import.meta.env.BASE_URL}aurora-portrait.webp`} alt="Illustrated portrait of Aurora, a fictional adult AI companion" />
      <div className="aurora-presence-copy">
        <p className="eyebrow">MEET AI AURORA</p>
        <h2>A familiar face while you talk</h2>
        <p className="small">Aurora is an illustrated AI character. Her optional voice is AI generated. Spoken text is sent to our speech provider only when you choose to play it. A microphone draft is never sent until you press Send.</p>
        <p className="small">Voice preview: feminine English with a light Latin American Spanish accent.</p>
        <div className="voice-controls">
          <button type="button" onClick={toggleListening} disabled={!recognitionType} aria-pressed={listening}>
            {listening ? 'Stop listening' : 'Speak a message'}
          </button>
          <button type="button" onClick={() => speaking || loading ? stopPlayback() : void play(VOICE_SAMPLE)} disabled={!available} aria-pressed={speaking}>
            {loading ? 'Stop loading' : speaking ? 'Stop voice' : 'Hear Aurora sample'}
          </button>
          <button type="button" onClick={() => speaking || loading ? stopPlayback() : latestReply && void play(latestReply)} disabled={!available || !latestReply} aria-pressed={speaking}>
            {speaking || loading ? 'Stop voice' : 'Hear latest reply'}
          </button>
        </div>
        {!available && <p className="small">Aurora’s voice preview will be available after sign-in, adult verification and speech service setup. Text chat remains available.</p>}
        {!recognitionType && <p className="small">Microphone input is unavailable in this browser. You can type instead.</p>}
        {voiceStatus && <p className="small" role="status">{voiceStatus}</p>}
      </div>
    </div>
  )
}
