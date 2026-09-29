import { useEffect, useRef, useState } from 'react'
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storage'

const VOICE_KEY = 'ai_aurora_voice_uri'
const RATE_KEY = 'ai_aurora_voice_rate'
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

export function AuroraPresence({ latestReply, onTranscript }: { latestReply?: string; onTranscript: (text: string) => void }) {
  const recognitionRef = useRef<Recognition | null>(null)
  const playbackId = useRef(0)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceUri, setVoiceUri] = useState(() => safeLocalStorageGet(VOICE_KEY, ''))
  const [rate, setRate] = useState(() => safeLocalStorageGet(RATE_KEY, 1))
  const supportsSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window
  const recognitionType = typeof window !== 'undefined'
    ? (window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition
    : undefined

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const refreshVoices = () => setVoices(window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('en')))
    refreshVoices()
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices)
  }, [])

  useEffect(() => () => {
    recognitionRef.current?.stop()
    playbackId.current += 1
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

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

  const stopPlayback = () => {
    playbackId.current += 1
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  const play = (text: string) => {
    if (!supportsSpeech) return
    stopPlayback()
    const id = ++playbackId.current
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = voices.find((item) => item.voiceURI === voiceUri)
      ?? voices.find((item) => item.lang.toLowerCase() === 'en-gb')
      ?? voices[0]
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang || 'en-GB'
    utterance.rate = rate
    utterance.onend = () => { if (id === playbackId.current) setSpeaking(false) }
    utterance.onerror = () => { if (id === playbackId.current) { setSpeaking(false); setVoiceStatus('This voice stopped. Try another voice or use text chat.') } }
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <div className="aurora-presence">
      <img src={`${import.meta.env.BASE_URL}aurora-portrait.webp`} alt="Illustrated portrait of Aurora, a fictional adult AI companion" />
      <div className="aurora-presence-copy">
        <p className="eyebrow">MEET AI AURORA</p>
        <h2>A familiar face while you talk</h2>
        <p className="small">Aurora is an illustrated AI character. Choose a voice from those installed on your device. Your browser provider may process speech audio and text. A spoken draft is never sent until you press Send.</p>
        {supportsSpeech && <div className="voice-options">
          <label>Choose Aurora's voice
            <select value={voiceUri} onChange={(event) => { stopPlayback(); setVoiceUri(event.target.value); safeLocalStorageSet(VOICE_KEY, event.target.value) }}>
              <option value="">Device voice (English UK when available)</option>
              {voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}
            </select>
          </label>
          <label>Speaking pace
            <select value={rate} onChange={(event) => { stopPlayback(); const next = Number(event.target.value); setRate(next); safeLocalStorageSet(RATE_KEY, next) }}>
              <option value={0.85}>Gentle</option><option value={1}>Natural</option><option value={1.1}>Brisk</option>
            </select>
          </label>
          <button type="button" onClick={() => speaking ? stopPlayback() : play(VOICE_SAMPLE)}>{speaking ? 'Stop voice' : 'Hear voice sample'}</button>
        </div>}
        <div className="voice-controls">
          <button type="button" onClick={toggleListening} disabled={!recognitionType} aria-pressed={listening}>
            {listening ? 'Stop listening' : 'Speak a message'}
          </button>
          <button type="button" onClick={() => speaking ? stopPlayback() : latestReply && play(latestReply)} disabled={!supportsSpeech || !latestReply} aria-pressed={speaking}>
            {speaking ? 'Stop voice' : 'Hear latest reply'}
          </button>
        </div>
        {(!recognitionType || !supportsSpeech) && <p className="small">Voice features are unavailable in this browser. Text chat still works.</p>}
        {voiceStatus && <p className="small" role="status">{voiceStatus}</p>}
      </div>
    </div>
  )
}
