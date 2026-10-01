import { useEffect, useMemo, useRef, useState } from 'react'
import { AuroraFigure } from './AuroraFigure'
import { generateAuroraSpeech, speechAvailable } from '../services/speechService'
import { getOwnerAuroraAccess, sendOwnerAuroraChat } from '../services/ownerAuroraService'
import { loadSession, type AuthSession } from '../services/authService'
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storage'

type OwnerMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

const ownerKey = (name: string, session: AuthSession) => `ai_owner_aurora_${name}:account:${session.user.id}`
const quickPrompts = [
  'Help me choose the next launch priority.',
  'Turn my notes into a short action list.',
  'Help me plan the next AI Doctor work session.',
  'Give me a concise end-of-day project review.',
]

export function OwnerAurora() {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(false)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [messages, setMessages] = useState<OwnerMessage[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [noteDraft, setNoteDraft] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const latestReply = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant')?.text || '',
    [messages],
  )

  useEffect(() => {
    const sync = (next?: AuthSession | null) => setSession(next === undefined ? loadSession() : next)
    const handleAuth = (event: Event) => sync((event as CustomEvent<AuthSession | null>).detail)
    const handleFocus = () => sync()
    window.addEventListener('aurora-auth-session', handleAuth)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('aurora-auth-session', handleAuth)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  useEffect(() => {
    let active = true
    setAllowed(false)
    setOpen(false)
    if (!session) return () => { active = false }
    setMessages(safeLocalStorageGet(ownerKey('messages', session), []))
    setNotes(safeLocalStorageGet(ownerKey('notes', session), []))
    setChecking(true)
    void getOwnerAuroraAccess(session)
      .then((result) => { if (active) setAllowed(result) })
      .catch(() => { if (active) setAllowed(false) })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [session?.user.id])

  useEffect(() => {
    if (session && allowed) safeLocalStorageSet(ownerKey('messages', session), messages.slice(-60))
  }, [messages, session, allowed])

  useEffect(() => {
    if (session && allowed) safeLocalStorageSet(ownerKey('notes', session), notes.slice(-30))
  }, [notes, session, allowed])

  const send = async (seed?: string) => {
    if (!session || !allowed || busy) return
    const text = (seed ?? input).trim().slice(0, 1800)
    if (!text) return
    const userMessage: OwnerMessage = { id: crypto.randomUUID(), role: 'user', text, createdAt: new Date().toISOString() }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setBusy(true)
    setStatus('Owner Aurora is thinking…')
    try {
      const reply = await sendOwnerAuroraChat(
        session,
        nextMessages.map(({ role, text: messageText }) => ({ role, text: messageText })),
        notes,
      )
      setMessages((current) => [...current, {
        id: crypto.randomUUID(), role: 'assistant', text: reply, createdAt: new Date().toISOString(),
      }])
      setStatus('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Owner Aurora is unavailable.')
    } finally {
      setBusy(false)
    }
  }

  const speakLatest = async () => {
    if (!session || !latestReply || !speechAvailable()) return
    audioRef.current?.pause()
    setStatus('Preparing Aurora’s voice…')
    try {
      const blob = await generateAuroraSpeech(session, latestReply)
      const audio = new Audio(URL.createObjectURL(blob))
      audioRef.current = audio
      audio.onended = () => setStatus('')
      await audio.play()
      setStatus('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Aurora’s voice is unavailable.')
    }
  }

  const addNote = () => {
    const value = noteDraft.trim().slice(0, 280)
    if (!value || notes.includes(value)) return
    setNotes((current) => [...current, value].slice(-30))
    setNoteDraft('')
  }

  if (!session || checking || !allowed) return null

  return (
    <aside className={`owner-aurora ${open ? 'owner-aurora-open' : ''}`} aria-label="Private Owner Aurora">
      {!open ? (
        <button className="owner-aurora-launcher" type="button" onClick={() => setOpen(true)}>
          <span aria-hidden="true">A</span> Owner Aurora
        </button>
      ) : (
        <div className="owner-aurora-panel">
          <header className="owner-aurora-header">
            <div className="owner-aurora-mini" aria-hidden="true"><AuroraFigure /></div>
            <div><strong>Owner Aurora</strong><small>Private owner workspace · AI</small></div>
            <button type="button" aria-label="Close Owner Aurora" onClick={() => setOpen(false)}>×</button>
          </header>

          <p className="owner-aurora-boundary">Private to your authorised owner account. Owner Aurora does not read customer conversations or customer private data.</p>

          <div className="owner-aurora-prompts" aria-label="Owner Aurora quick prompts">
            {quickPrompts.map((prompt) => <button key={prompt} type="button" disabled={busy} onClick={() => void send(prompt)}>{prompt}</button>)}
          </div>

          <div className="owner-aurora-chat" role="log" aria-live="polite">
            {messages.length === 0 ? <p>Ask Aurora to organise a launch task, project note or next step.</p> : messages.slice(-16).map((message) => (
              <div key={message.id} className={`owner-message owner-message-${message.role}`}>
                <strong>{message.role === 'assistant' ? 'Aurora' : 'You'}</strong>
                <span>{message.text}</span>
              </div>
            ))}
          </div>

          <div className="owner-aurora-input">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} maxLength={1800} placeholder="What do you want help organising?" />
            <button type="button" disabled={busy || !input.trim()} onClick={() => void send()}>{busy ? 'Thinking…' : 'Ask Aurora'}</button>
            <button type="button" disabled={!latestReply || !speechAvailable()} onClick={() => void speakLatest()}>Hear reply</button>
          </div>

          <details className="owner-aurora-notes">
            <summary>Private owner notes ({notes.length})</summary>
            <p>Only notes you explicitly save here are sent as bounded context to Owner Aurora.</p>
            <div className="owner-note-input">
              <input value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} maxLength={280} placeholder="Add a private project note" />
              <button type="button" onClick={addNote}>Save note</button>
            </div>
            {notes.length > 0 && <ul>{notes.map((note) => (
              <li key={note}><span>{note}</span><button type="button" onClick={() => setNotes((current) => current.filter((item) => item !== note))}>Remove</button></li>
            ))}</ul>}
          </details>

          {status && <p className="owner-aurora-status" role="status">{status}</p>}
        </div>
      )}
    </aside>
  )
}
