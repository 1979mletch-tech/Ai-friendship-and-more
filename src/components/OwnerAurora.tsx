import { useEffect, useMemo, useRef, useState } from 'react'
import { AuroraFigure } from './AuroraFigure'
import { generateAuroraSpeech, speechAvailable } from '../services/speechService'
import { getOwnerAuroraStatus, sendOwnerAuroraChat, type OwnerReadiness } from '../services/ownerAuroraService'
import { loadSession, type AuthSession } from '../services/authService'
import { safeLocalStorageDelete, safeLocalStorageGet, safeLocalStorageSet } from '../utils/storage'
import { downloadJson } from '../utils/exportData'
import { createOwnerWorkspaceExport, defaultOwnerProjects, sanitizeOwnerMessages, sanitizeOwnerNotes, sanitizeOwnerProjects, type OwnerProject, type StoredOwnerMessage } from '../utils/ownerWorkspace'

type OwnerMessage = StoredOwnerMessage

const ownerKey = (name: string, session: AuthSession) => `ai_owner_aurora_${name}:account:${session.user.id}`
const quickPrompts = [
  'Help me choose the next launch priority.',
  'Turn my notes into a short action list.',
  'Help me plan the next AI Doctor work session.',
  'Give me a concise end-of-day project review.',
]
const readinessLabels: Record<keyof OwnerReadiness, string> = {
  ai: 'Real AI',
  speech: 'Aurora voice',
  billing: 'Live billing',
  webhook: 'Stripe webhook',
  ageVerification: 'Adult verification',
  returnUrl: 'Return routing',
}

export function OwnerAurora() {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(false)
  const [readiness, setReadiness] = useState<OwnerReadiness | null>(null)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [messages, setMessages] = useState<OwnerMessage[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [noteDraft, setNoteDraft] = useState('')
  const [projects, setProjects] = useState<OwnerProject[]>(defaultOwnerProjects)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const latestReply = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant')?.text || '',
    [messages],
  )
  const readinessComplete = readiness ? Object.values(readiness).every(Boolean) : false

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

  const refreshOwnerStatus = async (activeSession: AuthSession, active = true) => {
    setChecking(true)
    try {
      const result = await getOwnerAuroraStatus(activeSession)
      if (!active) return
      setAllowed(result.owner)
      setReadiness(result.readiness ?? null)
    } catch {
      if (!active) return
      setAllowed(false)
      setReadiness(null)
    } finally {
      if (active) setChecking(false)
    }
  }

  useEffect(() => {
    let active = true
    setAllowed(false)
    setReadiness(null)
    setOpen(false)
    if (!session) return () => { active = false }
    setMessages(sanitizeOwnerMessages(safeLocalStorageGet(ownerKey('messages', session), [])))
    setNotes(sanitizeOwnerNotes(safeLocalStorageGet(ownerKey('notes', session), [])))
    const savedProjects = sanitizeOwnerProjects(safeLocalStorageGet(ownerKey('projects', session), []))
    setProjects(savedProjects.length ? savedProjects : defaultOwnerProjects())
    void refreshOwnerStatus(session, active)
    return () => { active = false }
  }, [session?.user.id])

  useEffect(() => {
    if (session && allowed) safeLocalStorageSet(ownerKey('messages', session), sanitizeOwnerMessages(messages))
  }, [messages, session, allowed])

  useEffect(() => {
    if (session && allowed) safeLocalStorageSet(ownerKey('notes', session), sanitizeOwnerNotes(notes))
  }, [notes, session, allowed])

  useEffect(() => {
    if (session && allowed) safeLocalStorageSet(ownerKey('projects', session), sanitizeOwnerProjects(projects))
  }, [projects, session, allowed])

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
        projects,
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
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { URL.revokeObjectURL(url); setStatus('') }
      audio.onerror = () => { URL.revokeObjectURL(url); setStatus('Audio could not play on this device.') }
      await audio.play()
      setStatus('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Aurora’s voice is unavailable.')
    }
  }

  const addNote = () => {
    const value = noteDraft.trim().slice(0, 280)
    if (!value || notes.includes(value)) return
    setNotes((current) => sanitizeOwnerNotes([...current, value]))
    setNoteDraft('')
  }

  const clearWorkspace = () => {
    if (!session || !window.confirm('Clear your private Owner Aurora chat and notes from this browser?')) return
    audioRef.current?.pause()
    safeLocalStorageDelete(ownerKey('messages', session), ownerKey('notes', session), ownerKey('projects', session))
    setMessages([])
    setNotes([])
    setProjects(defaultOwnerProjects())
    setInput('')
    setNoteDraft('')
    setStatus('Private Owner Aurora browser data cleared.')
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

          {readiness && (
            <section className={`owner-readiness ${readinessComplete ? 'owner-readiness-ready' : ''}`} aria-label="Launch readiness">
              <div className="owner-readiness-head">
                <strong>{readinessComplete ? 'Launch services configured' : 'Launch services need attention'}</strong>
                <button type="button" onClick={() => session && void refreshOwnerStatus(session)}>Refresh</button>
              </div>
              <div className="owner-readiness-grid">
                {(Object.keys(readinessLabels) as (keyof OwnerReadiness)[]).map((key) => (
                  <span key={key} className={readiness[key] ? 'ready' : 'blocked'}>
                    <b aria-hidden="true">{readiness[key] ? '✓' : '!'}</b> {readinessLabels[key]}
                  </span>
                ))}
              </div>
            </section>
          )}


          <section className="owner-projects" aria-label="Owner projects">
            <div className="owner-readiness-head"><strong>Project control centre</strong><small>Verified boundaries</small></div>
            {projects.map((project) => (
              <article key={project.id} className="owner-project-card">
                <div><strong>{project.name}</strong><span>{project.status}</span></div>
                <p>{project.summary}</p>
                <small>{project.id === 'ai-friendship' ? 'Current workspace · repository work verified in this project' : 'Next project · repository not connected or verified from this workspace'}</small>
              </article>
            ))}
          </section>

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

          <div className="owner-data-actions">
            <button type="button" onClick={() => downloadJson('owner-aurora-workspace.json', createOwnerWorkspaceExport(messages, notes))}>Export my owner workspace</button>
            <button type="button" onClick={clearWorkspace}>Clear private workspace</button>
          </div>

          {status && <p className="owner-aurora-status" role="status">{status}</p>}
        </div>
      )}
    </aside>
  )
}
