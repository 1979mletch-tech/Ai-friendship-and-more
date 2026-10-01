import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { AuthSession } from '../services/authService'
import { generateAuroraSpeech, speechAvailable } from '../services/speechService'
import { getAuroraDaypart, inferAuroraScene, type AuroraScene } from '../utils/auroraActivity'
import { inferAuroraReaction, type AuroraReaction } from '../utils/auroraReaction'
import { AuroraFigure } from './AuroraFigure'
import '../auroraMotion.css'

const VOICE_SAMPLE = "Hello, I'm Aurora. Take your time. I'm here with you. What's on your mind today?"

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

const sceneCopy: Record<AuroraScene, { label: string; status: string }> = {
  together: { label: 'Together', status: 'Aurora is here with you.' },
  walk: { label: 'Walk', status: 'Aurora is walking alongside you on screen.' },
  exercise: { label: 'Exercise', status: 'Aurora is moving and stretching with you on screen.' },
  relax: { label: 'Relax', status: 'Aurora is settling down with you.' },
  sleep: { label: 'Sleep', status: 'Aurora is in a quiet bedtime scene.' },
}

const reactionCopy: Record<AuroraReaction, string> = {
  neutral: 'Present',
  warm: 'Warmly with you',
  amused: 'Sharing the smile',
  celebrate: 'Celebrating with you',
  encourage: 'Encouraging you',
  calm: 'Keeping things calm',
  focus: 'Focused with you',
  concerned: 'Listening closely',
}

const momentStarters: Array<{ label: string; scene: AuroraScene; prompt: string }> = [
  { label: 'Walk with me', scene: 'walk', prompt: "I'm going for a walk. Keep me company and chat with me while I go." },
  { label: 'Stretch with me', scene: 'exercise', prompt: "Let's do a gentle stretch together. Keep me company and help me stay focused." },
  { label: 'Wind down', scene: 'relax', prompt: "I'm winding down. Keep me company with a calm conversation." },
  { label: 'Focus together', scene: 'together', prompt: 'Help me focus on one useful next step and stay with me while I work through it.' },
  { label: 'Bedtime chat', scene: 'sleep', prompt: "I'm getting ready for bed. Keep me company while I wind down." },
]

const readPresenceSetting = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const savePresenceSetting = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage can be unavailable */ }
}

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
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const urlRef = useRef<string | null>(null)
  const playbackId = useRef(0)
  const lastAutoSpokenRef = useRef('')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [scene, setScene] = useState<AuroraScene>('together')
  const [reaction, setReaction] = useState<AuroraReaction>('neutral')
  const [autoFollow, setAutoFollow] = useState(true)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [voiceEnergy, setVoiceEnergy] = useState(0)
  const [externalAiBusy, setExternalAiBusy] = useState(false)
  const [engagement, setEngagement] = useState<'idle' | 'engaged'>('idle')
  const [gaze, setGaze] = useState<'center' | 'left' | 'right'>('center')
  const daypart = getAuroraDaypart()
  const available = speechAvailable() && Boolean(session)
  const motionState = speaking ? 'speaking' : listening ? 'listening' : aiBusy || externalAiBusy || loading ? 'thinking' : scene
  const presenceKey = `ai_aurora_presence:${session?.user.id ?? 'guest'}`
  const recognitionType = typeof window !== 'undefined'
    ? (window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition
    : undefined

  const stopVoiceMeter = () => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = null
    analyserRef.current = null
    setVoiceEnergy(0)
  }

  const startVoiceMeter = (audio: HTMLAudioElement) => {
    try {
      const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextCtor) return
      const context = audioContextRef.current ?? new AudioContextCtor()
      audioContextRef.current = context
      const source = context.createMediaElementSource(audio)
      const analyser = context.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      analyser.connect(context.destination)
      analyserRef.current = analyser
      const samples = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(samples)
        const average = samples.reduce((sum, sample) => sum + sample, 0) / Math.max(1, samples.length)
        setVoiceEnergy(Math.min(1, average / 110))
        animationFrameRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      setVoiceEnergy(0)
    }
  }

  const stopPlayback = () => {
    playbackId.current += 1
    audioRef.current?.pause()
    audioRef.current = null
    stopVoiceMeter()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setSpeaking(false)
    setLoading(false)
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
        startVoiceMeter(audio)
        setLoading(false)
        setSpeaking(true)
        setVoiceStatus('')
      }
    } catch (error) {
      if (id === playbackId.current) { stopPlayback(); setVoiceStatus(error instanceof Error ? error.message : 'Aurora’s voice is unavailable.') }
    }
  }

  useEffect(() => {
    const saved = readPresenceSetting<{ scene?: AuroraScene; autoFollow?: boolean }>(presenceKey, {})
    if (saved.scene && saved.scene in sceneCopy) setScene(saved.scene)
    setAutoFollow(saved.autoFollow !== false)
    setAutoSpeak(false)
    lastAutoSpokenRef.current = latestReply ?? ''
  }, [presenceKey])

  useEffect(() => {
    savePresenceSetting(presenceKey, { scene, autoFollow })
  }, [presenceKey, scene, autoFollow])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let timer = 0
    const scheduleGaze = () => {
      timer = window.setTimeout(() => {
        setGaze((current) => current === 'center' ? (Date.now() % 2 ? 'left' : 'right') : 'center')
        scheduleGaze()
      }, 4200 + Math.floor(Math.random() * 3800))
    }
    scheduleGaze()
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleAiBusy = (event: Event) => setExternalAiBusy(Boolean((event as CustomEvent<boolean>).detail))
    const handleUserMessage = (event: Event) => {
      const text = (event as CustomEvent<string>).detail
      if (typeof text !== 'string') return
      setReaction(inferAuroraReaction(text))
      setEngagement('engaged')
      window.setTimeout(() => setEngagement('idle'), 6500)
      if (!autoFollow) return
      const nextScene = inferAuroraScene(text)
      if (nextScene) setScene(nextScene)
    }
    window.addEventListener('aurora-ai-busy', handleAiBusy)
    window.addEventListener('aurora-user-message', handleUserMessage)
    return () => {
      window.removeEventListener('aurora-ai-busy', handleAiBusy)
      window.removeEventListener('aurora-user-message', handleUserMessage)
    }
  }, [autoFollow])

  useEffect(() => {
    if (!latestReply) return
    const nextReaction = inferAuroraReaction(latestReply)
    if (nextReaction !== 'neutral') setReaction(nextReaction)
  }, [latestReply])

  useEffect(() => {
    if (!autoSpeak || !available || !latestReply || latestReply === lastAutoSpokenRef.current) return
    lastAutoSpokenRef.current = latestReply
    void play(latestReply)
  }, [autoSpeak, available, latestReply])

  useEffect(() => () => {
    recognitionRef.current?.stop()
    playbackId.current += 1
    audioRef.current?.pause()
    stopVoiceMeter()
    void audioContextRef.current?.close().catch(() => undefined)
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])

  useEffect(() => () => {
    playbackId.current += 1
    audioRef.current?.pause()
    stopVoiceMeter()
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
        setReaction(inferAuroraReaction(transcript))
        setVoiceStatus('Voice draft added. Review it before sending.')
      }
    }
    recognition.onerror = () => { setListening(false); setVoiceStatus('Microphone unavailable. You can type instead.') }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    try { recognition.start(); setListening(true); setVoiceStatus('Listening…') }
    catch { setVoiceStatus('Microphone unavailable. You can type instead.') }
  }

  const startSharedMoment = (nextScene: AuroraScene, prompt: string) => {
    setScene(nextScene)
    setReaction(nextScene === 'sleep' || nextScene === 'relax' ? 'calm' : nextScene === 'together' ? 'focus' : 'neutral')
    onTranscript(prompt)
  }

  return (
    <div
      className={`aurora-presence aurora-motion-${motionState} aurora-scene-${scene}`}
      data-motion-state={motionState}
      data-scene={scene}
      data-daypart={daypart}
      data-reaction={reaction}
      data-engagement={engagement}
      data-gaze={gaze}
      style={{ '--aurora-voice-energy': voiceEnergy.toFixed(3) } as CSSProperties}
    >
      <div className="aurora-world" aria-label={`Aurora scene: ${sceneCopy[scene].label}`}>
        <div className="aurora-sky" aria-hidden="true" />
        <div className="aurora-horizon" aria-hidden="true" />
        <div className="aurora-path" aria-hidden="true" />
        <div className="aurora-exercise-mat" aria-hidden="true" />
        <div className="aurora-chair" aria-hidden="true" />
        <div className="aurora-bed" aria-hidden="true"><span className="aurora-pillow" /><span className="aurora-blanket" /></div>
        <div className="aurora-character"><AuroraFigure /></div>
        <div className="aurora-world-status" aria-live="polite">{sceneCopy[scene].status}</div>
        <div className="aurora-reaction-label" aria-hidden="true">{reactionCopy[reaction]}</div>
      </div>

      <div className="aurora-presence-copy">
        <p className="eyebrow">MEET AI AURORA</p>
        <h2>A companion who can share the moment</h2>
        <p className="small">Aurora is a fictional AI character. Her scenes are animated illustrations, and her optional voice is AI generated. She can keep you company during everyday activities without pretending to be physically present.</p>
        <p className="small">Voice profile: calm, gentle feminine English with a subtle Polish-accented feel.</p>

        <div className="aurora-moment-starters" role="group" aria-label="Shared moments with Aurora">
          {momentStarters.map((item) => (
            <button key={item.label} type="button" onClick={() => startSharedMoment(item.scene, item.prompt)}>{item.label}</button>
          ))}
        </div>

        <div className="aurora-activity-controls" role="group" aria-label="Aurora activity">
          {(Object.keys(sceneCopy) as AuroraScene[]).map((nextScene) => (
            <button
              key={nextScene}
              type="button"
              className={scene === nextScene ? 'active' : ''}
              onClick={() => setScene(nextScene)}
              aria-pressed={scene === nextScene}
            >
              {sceneCopy[nextScene].label}
            </button>
          ))}
        </div>

        <div className="aurora-presence-options" role="group" aria-label="Aurora presence options">
          <button type="button" onClick={() => setAutoFollow((current) => !current)} aria-pressed={autoFollow}>
            Follow activity: {autoFollow ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            disabled={!available}
            onClick={() => setAutoSpeak((current) => {
              const next = !current
              if (next) lastAutoSpokenRef.current = latestReply ?? ''
              else stopPlayback()
              return next
            })}
            aria-pressed={autoSpeak}
          >
            Speak new replies: {autoSpeak ? 'On' : 'Off'}
          </button>
        </div>

        <p className="small" aria-live="polite">Aurora motion: {motionState}. Scene: {sceneCopy[scene].label}. Reaction: {reactionCopy[reaction]}. Ambience: {daypart}.</p>
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
        {!available && <p className="small">Aurora’s voice becomes available after sign-in, adult verification and speech service setup. Text chat remains available.</p>}
        {!recognitionType && <p className="small">Microphone input is unavailable in this browser. You can type instead.</p>}
        {voiceStatus && <p className="small" role="status">{voiceStatus}</p>}
      </div>
    </div>
  )
}
