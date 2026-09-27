import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getSubscriptionState } from './services/subscriptionService'
import { downloadLocalData, MAX_MESSAGE_LENGTH, MAX_NOTE_LENGTH, MAX_PROJECT_LENGTH, readMessages, readNotes, type ChatMessage, type ProjectNote } from './utils/chatData'
import { applyProjectNotesLimit, getEntitlements, plans } from './utils/entitlements'
import { disclosureText, isCrisisText } from './utils/safety'
import { safeLocalStorageDelete, safeLocalStorageGet, safeLocalStorageSet } from './utils/storage'

type Route = '/' | '/chat' | '/pricing' | '/privacy' | '/immersive' | '/safety'
type ChatMode = 'general' | 'creative'

const STORAGE_KEYS = {
  consent: 'ai_friendship_consent',
  messages: 'ai_friendship_messages',
  notes: 'ai_friendship_project_notes',
}

const parseRoute = (): Route => {
  const hash = window.location.hash.replace('#', '') || '/'
  if (hash === '/chat' || hash === '/pricing' || hash === '/privacy' || hash === '/immersive' || hash === '/safety') {
    return hash
  }
  return '/'
}

const getLocalDayKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const App = () => {
  const [route, setRoute] = useState<Route>(parseRoute())
  const [hasConsent, setHasConsent] = useState<boolean>(() =>
    safeLocalStorageGet(STORAGE_KEYS.consent, false),
  )
  // No trusted billing or entitlement service exists yet. Browser storage cannot grant a paid plan.
  const planId = 'free' as const
  const [chatMode, setChatMode] = useState<ChatMode>('general')
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [deletePending, setDeletePending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    readMessages(safeLocalStorageGet(STORAGE_KEYS.messages, [])),
  )
  const [project, setProject] = useState('')
  const [tags, setTags] = useState('')
  const [note, setNote] = useState('')
  const [projectNotes, setProjectNotes] = useState<ProjectNote[]>(() =>
    applyProjectNotesLimit(
      readNotes(safeLocalStorageGet(STORAGE_KEYS.notes, [])),
      planId,
    ),
  )
  const [xrStatus, setXrStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')

  const billing = useMemo(() => getSubscriptionState(), [])
  const entitlements = useMemo(() => getEntitlements(planId), [planId])
  const visibleProjectNotes = useMemo(
    () => applyProjectNotesLimit(projectNotes, planId),
    [planId, projectNotes],
  )
  const filteredMessages = useMemo(() => messages.filter((message) => message.text.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [messages, search])
  const today = getLocalDayKey(new Date())
  const todayUserMessages = messages.filter(
    (message) =>
      message.role === 'user' &&
      message.dayKey === today,
  ).length

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    let active = true

    const detectXr = async () => {
      const xrApi = (navigator as Navigator & { xr?: { isSessionSupported: (mode: string) => Promise<boolean> } })
        .xr
      if (!xrApi?.isSessionSupported) {
        if (active) setXrStatus('unavailable')
        return
      }
      try {
        const supported = await xrApi.isSessionSupported('immersive-vr')
        if (active) setXrStatus(supported ? 'available' : 'unavailable')
      } catch {
        if (active) setXrStatus('unavailable')
      }
    }

    detectXr()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.consent, hasConsent), [hasConsent])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.messages, messages), [messages])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.notes, projectNotes), [projectNotes])

  const sendMessage = () => {
    if (!input.trim() || input.length > MAX_MESSAGE_LENGTH || !hasConsent) return
    const userText = input.trim()
    const crisis = isCrisisText(userText)
    if (todayUserMessages >= entitlements.usageLimits.dailyMessages && !crisis) return

    const response = crisis
      ? 'I care about your safety. If you are in immediate danger or might act on these thoughts, contact local emergency services now and reach out to a trusted person or crisis line in your region.'
      : chatMode === 'creative'
        ? 'Let’s keep your creative momentum going. Want a quick spark, a project check-in, or gentle feedback on your latest idea?'
        : 'I’m here with you. We can reflect, brainstorm, or just talk through what matters right now.'

    const localDayKey = getLocalDayKey(new Date())

    setMessages((current) => [...current,
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'user' as const,
        text: userText,
        createdAt: new Date().toISOString(),
        dayKey: localDayKey,
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        text: response,
        createdAt: new Date().toISOString(),
        dayKey: localDayKey,
      },
    ].slice(-500))
    setInput('')
  }

  const addProjectNote = () => {
    if (!project.trim() || !note.trim() || project.length > MAX_PROJECT_LENGTH || note.length > MAX_NOTE_LENGTH) return
    if (visibleProjectNotes.length >= entitlements.usageLimits.projectNotesLimit) return
    setProjectNotes((current) => [
      ...current,
      { id: crypto.randomUUID(), project: project.trim(), tags: tags.trim(), note: note.trim() },
    ])
    setProject('')
    setTags('')
    setNote('')
  }

  const clearLocalData = () => {
    safeLocalStorageDelete(STORAGE_KEYS.messages, STORAGE_KEYS.notes)
    setMessages([])
    setProjectNotes([])
    setDeletePending(false)
  }

  const renderHome = () => (
    <section className="panel">
      <h1>AI Friendship</h1>
      <p>
        A warm AI companion for artists and creative people—writers, musicians, designers, filmmakers,
        dancers, photographers—and anyone who wants supportive conversation.
      </p>
      <p>
        Use it for brainstorming, reflection, encouragement, creative blocks, and project continuity. It is
        not human, not therapy, and not an emergency service.
      </p>
      <div className="starters">
        {['Help me break a creative block', 'Give me 3 songwriting ideas', 'Reflect on my week kindly', 'Plan my next focused hour'].map(
          (starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => {
                window.location.hash = '/chat'
                setChatMode('creative')
                setInput(starter)
              }}
            >
              {starter}
            </button>
          ),
        )}
      </div>
    </section>
  )

  const renderChat = () => (
    <section className="panel">
      <h2>Companion Chat</h2>
      <p className="warn">Preview: replies are scripted examples. Live AI chat is not connected.</p>
      <p className="small">{disclosureText}</p>
      <a href="#/safety">Urgent help and safety information</a>
      <label className="consent">
        <input type="checkbox" checked={hasConsent} onChange={(e) => setHasConsent(e.target.checked)} />
        I understand these limits and want to continue.
      </label>

      <div className="mode-row">
        <label>
          Chat mode
          <select value={chatMode} onChange={(e) => setChatMode(e.target.value as ChatMode)}>
            <option value="general">General support</option>
            <option value="creative">Creative mode</option>
          </select>
        </label>
      </div>

      {chatMode === 'creative' && (
        <div className="starters">
          {['Creative check-in', 'Idea spark for my project', 'Weekly review prompt', 'Tag this project direction'].map((starter) => (
            <button key={starter} type="button" onClick={() => setInput(starter)}>
              {starter}
            </button>
          ))}
        </div>
      )}

      <label className="search-label">Search local conversation
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages" />
      </label>
      <div className="chat-box" role="log" aria-live="polite" aria-relevant="additions text">
        {filteredMessages.length === 0 ? (
          <p className="small">{search ? 'No matching messages.' : 'No messages yet. Start with a topic starter or your own question.'}</p>
        ) : (
          <ul>
            {filteredMessages.map((msg) => (
              <li key={msg.id} className={msg.role === 'assistant' ? 'assistant' : 'user'}>
                <strong>{msg.role === 'assistant' ? 'Friend' : 'You'}:</strong> {msg.text}
                <button className="subtle" type="button" aria-label={`Delete ${msg.role} message`} onClick={() => setMessages((current) => current.filter((item) => item.id !== msg.id))}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className="input-row" onSubmit={(e) => { e.preventDefault(); sendMessage() }}>
        <label htmlFor="chat-input">Your message</label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Share what’s on your mind or your project."
          maxLength={MAX_MESSAGE_LENGTH}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
        />
        <button
          type="submit"
          disabled={!input.trim() || !hasConsent || (!isCrisisText(input) && todayUserMessages >= entitlements.usageLimits.dailyMessages)}
        >
          Send
        </button>
      </form>
      <p className="small">{input.length}/{MAX_MESSAGE_LENGTH} characters. Enter sends; Shift+Enter adds a line.</p>
      <p className="small">
        Daily message usage: {todayUserMessages}. Plan limit per day:{' '}
        {entitlements.usageLimits.dailyMessages}.
      </p>
      {todayUserMessages >= entitlements.usageLimits.dailyMessages && (
        <p className="warn">You reached today’s message limit. Urgent safety messages still work.</p>
      )}

      <h3>Creative project memory (local fallback)</h3>
      <p className="small">
        Keep only non-sensitive preferences, approved project notes, and creative context. Limit: {entitlements.usageLimits.projectNotesLimit} notes for your current plan.
      </p>
      <div className="grid">
        <label>
          Project name
          <input value={project} onChange={(e) => setProject(e.target.value)} maxLength={MAX_PROJECT_LENGTH} placeholder="Project name" />
        </label>
        <label>
          Project tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            maxLength={MAX_PROJECT_LENGTH}
            placeholder="Tags: mood, style, deadline"
          />
        </label>
      </div>
      <label>
        Project note
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          placeholder="Project note / idea spark / check-in"
        />
      </label>
      <button type="button" onClick={addProjectNote}>
        Save project note
      </button>
      <ul>
        {visibleProjectNotes.map((item) => (
          <li key={item.id}>
            <strong>{item.project}</strong> [{item.tags || 'untagged'}]: {item.note}
            <button className="subtle" type="button" aria-label={`Delete note for ${item.project}`} onClick={() => setProjectNotes((current) => current.filter((entry) => entry.id !== item.id))}>Delete</button>
          </li>
        ))}
      </ul>
      <a href="#/privacy">Manage or export local data</a>
    </section>
  )

  const renderPricing = () => (
    <section className="panel">
      <h2>Pricing & Subscription</h2>
      <p>
        Paid plans are proposed previews. Checkout is not available yet; the free plan is the only active plan.
      </p>
      <p className="warn">{billing.setupMessage}</p>
      <div className="plans">
        {plans.map((plan) => (
          <article key={plan.id} className="plan">
            <h3>{plan.name}</h3>
            <p>{plan.priceLabel}</p>
            {plan.proposed && <p className="small">Proposed price (editable via environment config)</p>}
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <p className="small">{plan.id === 'free' ? 'Current plan' : 'Coming soon — no payment taken'}</p>
          </article>
        ))}
      </div>
      <p className="small">
        Current plan: Free. Safety disclosures, privacy controls, and crisis guidance remain available.
      </p>
    </section>
  )

  const renderPrivacy = () => (
    <section className="panel">
      <h2>Privacy Centre</h2>
      <ul>
        <li>This preview saves messages, notes, and consent in this browser’s local storage. Anyone with access to this browser profile may read them.</li>
        <li>This preview does not send chat messages to an AI or database provider.</li>
        <li>Export your local messages and notes as JSON, or delete them below. Browser clearing may also remove them.</li>
        <li>Future connected versions need a separate privacy policy explaining provider processing, retention, and deletion.</li>
      </ul>
      <p>
        AI Friendship is not legally privileged communication, not a therapist, and not absolute confidentiality.
      </p>
      <p className="warn">
        Production launch still requires: security review, access controls, logging policy, retention policy, and
        provider data-processing/legal review.
      </p>
      <button type="button" onClick={() => downloadLocalData(messages, projectNotes)}>Export local data</button>{' '}
      {!deletePending ? <button type="button" onClick={() => setDeletePending(true)}>Delete local messages and notes</button> : (
        <div role="group" aria-label="Confirm local data deletion">
          <p className="warn">Delete all saved messages and project notes from this browser?</p>
          <button type="button" onClick={clearLocalData}>Yes, delete data</button>{' '}
          <button type="button" onClick={() => setDeletePending(false)}>Cancel</button>
        </div>
      )}
      <label className="consent"><input type="checkbox" checked={hasConsent} onChange={(e) => setHasConsent(e.target.checked)} /> Allow preview chat on this browser</label>
      <p className="small">Turning off consent blocks new messages. Use the delete control above to remove existing data.</p>
    </section>
  )

  const renderSafety = () => (
    <section className="panel">
      <h2>Safety and urgent help</h2>
      <p>This scripted preview cannot assess risk, respond reliably to emergencies, or provide therapy.</p>
      <p className="warn">If you or someone else is in immediate danger, contact your local emergency service now. In the UK, call 999 or 112.</p>
      <p>In the UK, NHS 111 can help with urgent non-emergency health concerns. It does not replace 999 or 112 for an emergency.</p>
      <p>If you might harm yourself, move away from anything you could use to hurt yourself and contact emergency services or a trusted person who can stay with you.</p>
      <p>If you are outside the UK, use your local emergency number and local crisis services.</p>
      <a href="#/chat">Return to chat preview</a>
    </section>
  )

  const renderImmersive = () => (
    <section className="panel">
      <h2>Immersive Friend (VR Preview / Coming Next)</h2>
      <p>
        Calm creative studio preview for desktop/mobile now. Full headset/WebXR support is a future integration,
        not active in this V1 phase.
      </p>
      <div className="immersive-room" role="img" aria-label="Creative studio visual preview">
        <div className="orb" />
        <p>Companion presence • soft studio ambience • reflective space</p>
      </div>
      <div className="starters">
        {['Walk me through today’s creative focus', 'Give me one brave next step', 'Summarize my project mood'].map(
          (card) => (
            <button key={card} type="button" onClick={() => setInput(card)}>
              {card}
            </button>
          ),
        )}
      </div>
      <p className="small">
        WebXR capability detected:{' '}
        {xrStatus === 'checking'
          ? 'checking…'
          : xrStatus === 'available'
            ? 'yes (future upgrade boundary ready)'
            : 'not detected'}
      </p>
      <p className="small">
        Future architecture boundary: WebXR/Three.js module, capability detection, keyboard/screen-reader fallback,
        and explicit privacy controls for voice/spatial signals.
      </p>
    </section>
  )

  let page = renderHome()
  switch (route) {
    case '/chat':
      page = renderChat()
      break
    case '/pricing':
      page = renderPricing()
      break
    case '/privacy':
      page = renderPrivacy()
      break
    case '/immersive':
      page = renderImmersive()
      break
    case '/safety':
      page = renderSafety()
      break
    default:
      page = renderHome()
      break
  }

  return (
    <div className="shell">
      <header>
        <h1>AI Friendship V1+</h1>
        <nav aria-label="Main navigation">
          <a href="#/">Home</a>
          <a href="#/chat">Chat</a>
          <a href="#/pricing">Pricing</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/immersive">Immersive</a>
          <a href="#/safety">Safety</a>
        </nav>
      </header>
      <main>{page}</main>
      <footer>
        AI companion for reflection and creativity. Not human. Not therapy. Not emergency support.
      </footer>
    </div>
  )
}

export default App
