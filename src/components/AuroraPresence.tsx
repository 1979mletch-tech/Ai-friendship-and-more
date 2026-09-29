import { useEffect, useRef, useState } from 'react'

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
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const supportsSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window
  const recognitionType = typeof window !== 'undefined'
    ? (window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition
    : undefined

  useEffect(() => () => {
    recognitionRef.current?.stop()
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

  const togglePlayback = () => {
    if (!supportsSpeech) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    if (!latestReply) return
    const utterance = new SpeechSynthesisUtterance(latestReply)
    utterance.lang = navigator.language || 'en-GB'
    utterance.rate = 0.95
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <div className="aurora-presence">
      <img src={`${import.meta.env.BASE_URL}aurora-portrait.webp`} alt="Illustrated portrait of Aurora, a fictional adult AI companion" />
      <div className="aurora-presence-copy">
        <p className="eyebrow">MEET AI AURORA</p>
        <h2>A familiar face while you talk</h2>
        <p className="small">Aurora is an illustrated AI character. Voice is optional and uses your browser's speech features; your browser provider may process microphone audio. A spoken draft is never sent until you press Send.</p>
        <div className="voice-controls">
          <button type="button" onClick={toggleListening} disabled={!recognitionType} aria-pressed={listening}>
            {listening ? 'Stop listening' : 'Speak a message'}
          </button>
          <button type="button" onClick={togglePlayback} disabled={!supportsSpeech || !latestReply} aria-pressed={speaking}>
            {speaking ? 'Stop voice' : 'Hear latest reply'}
          </button>
        </div>
        {(!recognitionType || !supportsSpeech) && <p className="small">Voice features are unavailable in this browser. Text chat still works.</p>}
        {voiceStatus && <p className="small" role="status">{voiceStatus}</p>}
      </div>
    </div>
  )
}
