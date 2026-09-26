import { useEffect, useMemo, useState } from 'react'
import './App.css'
import CloudChat from './cloud/CloudChat'
import { cloudConfigured } from './cloud/client'
import { getSubscriptionState } from './services/subscriptionService'
import { normalizeConversations, searchConversations, titleFromMessage, type ChatMessage, type Conversation } from './utils/conversations'
import { downloadLocalData } from './utils/export'
import type { PlanId } from './types/subscription'
import { applyProjectNotesLimit, getEntitlements, plans } from './utils/entitlements'
import { crisisGuidance, disclosureText, isCrisisText } from './utils/safety'
import { safeLocalStorageDelete, safeLocalStorageGet, safeLocalStorageSet } from './utils/storage'

type Route = '/' | '/chat' | '/cloud' | '/history' | '/setup' | '/pricing' | '/privacy' | '/immersive'
type ChatMode = 'general' | 'creative'

type ProjectNote = {
  id: string
  project: string
  tags: string
  note: string
}

const STORAGE_KEYS = {
  consent: 'ai_friendship_consent',
  plan: 'ai_friendship_plan',
  messages: 'ai_friendship_messages',
  conversations: 'ai_friendship_conversations',
  profile: 'ai_friendship_profile',
  notes: 'ai_friendship_project_notes',
}

const parseRoute = (): Route => {
  const hash = window.location.hash.replace('#', '') || '/'
  if (hash === '/chat' || hash === '/cloud' || hash === '/history' || hash === '/setup' || hash === '/pricing' || hash === '/privacy' || hash === '/immersive') {
    return hash
  }
  return '/'
}

const validPlanIds: PlanId[] = ['free', 'pro-monthly', 'pro-annual']

const normalizePlanId = (value: unknown): PlanId =>
  typeof value === 'string' && validPlanIds.includes(value as PlanId) ? (value as PlanId) : 'free'

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
  // Paid entitlements require a verified server subscription. Local selections are previews only.
  const [previewPlanId, setPreviewPlanId] = useState<PlanId>(() => normalizePlanId(safeLocalStorageGet(STORAGE_KEYS.plan, 'free')))
  const planId: PlanId = 'free'
  const [chatMode, setChatMode] = useState<ChatMode>('general')
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = safeLocalStorageGet<unknown>(STORAGE_KEYS.conversations, null)
    if (saved !== null) return normalizeConversations(saved)
    const legacy = safeLocalStorageGet<ChatMessage[]>(STORAGE_KEYS.messages, [])
    return Array.isArray(legacy) && legacy.length
      ? [{ id: 'legacy-conversation', title: 'Previous chat', updatedAt: new Date().toISOString(), messages: legacy }]
      : []
  })
  const [activeId, setActiveId] = useState<string | null>(() =>
    normalizeConversations(safeLocalStorageGet(STORAGE_KEYS.conversations, []))[0]?.id ??
    (safeLocalStorageGet<unknown>(STORAGE_KEYS.conversations, null) === null &&
    Array.isArray(safeLocalStorageGet(STORAGE_KEYS.messages, [])) &&
    safeLocalStorageGet<ChatMessage[]>(STORAGE_KEYS.messages, []).length ? 'legacy-conversation' : null),
  )
  const [companionName, setCompanionName] = useState(() => safeLocalStorageGet(STORAGE_KEYS.profile, 'Friend'))
  const messages = conversations.find((conversation) => conversation.id === activeId)?.messages ?? []
  const [historyQuery, setHistoryQuery] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [project, setProject] = useState('')
  const [tags, setTags] = useState('')
  const [note, setNote] = useState('')
  const [projectNotes, setProjectNotes] = useState<ProjectNote[]>(() =>
    applyProjectNotesLimit(
      safeLocalStorageGet(STORAGE_KEYS.notes, []),
      'free',
    ),
  )
  const [xrStatus, setXrStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')

  const billing = useMemo(() => getSubscriptionState(), [])
  const entitlements = useMemo(() => getEntitlements(planId), [planId])
  const visibleProjectNotes = useMemo(
    () => applyProjectNotesLimit(projectNotes, planId),
    [planId, projectNotes],
  )
  const filteredConversations = useMemo(
    () => searchConversations(conversations, historyQuery),
    [conversations, historyQuery],
  )
  const formatTime = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString()
  }
  const today = getLocalDayKey(new Date())
  const todayUserMessages = conversations.flatMap((conversation) => conversation.messages).filter(
    (message) =>
      message.role === 'user' &&
      (message.dayKey ||
        (message.createdAt ? getLocalDayKey(new Date(message.createdAt)) : '')) === today,
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
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.plan, previewPlanId), [previewPlanId])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.conversations, conversations), [conversations])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.profile, companionName), [companionName])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.notes, projectNotes), [projectNotes])

  const sendMessage = () => {
    if (!input.trim() || !hasConsent) return
    const userText = input.trim()
    const crisis = isCrisisText(userText)
    if (!crisis && todayUserMessages >= entitlements.usageLimits.dailyMessages) return

    const response = crisis
      ? crisisGuidance
      : chatMode === 'creative'
        ? 'Let’s keep your creative momentum going. Want a quick spark, a project check-in, or gentle feedback on your latest idea?'
        : 'I’m here with you. We can reflect, brainstorm, or just talk through what matters right now.'

    const localDayKey = getLocalDayKey(new Date())

    const newMessages: ChatMessage[] = [
      {
        id: crypto.randomUUID(),
        role: 'user',
        text: userText,
        createdAt: new Date().toISOString(),
        dayKey: localDayKey,
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: response,
        createdAt: new Date().toISOString(),
        dayKey: localDayKey,
      },
    ]
    const id = activeId ?? crypto.randomUUID()
    setConversations((current) => {
      const existing = current.find((conversation) => conversation.id === id)
      const updated: Conversation = {
        id,
        title: existing?.title ?? titleFromMessage(userText),
        updatedAt: new Date().toISOString(),
        messages: [...(existing?.messages ?? []), ...newMessages],
      }
      return [updated, ...current.filter((conversation) => conversation.id !== id)]
    })
    setActiveId(id)
    setInput('')
  }

  const addProjectNote = () => {
    if (!project.trim() || !note.trim()) return
    if (!editingNoteId && visibleProjectNotes.length >= entitlements.usageLimits.projectNotesLimit) return
    setProjectNotes((current) => editingNoteId
      ? current.map((item) => item.id === editingNoteId
        ? { ...item, project: project.trim(), tags: tags.trim(), note: note.trim() } : item)
      : [...current, { id: crypto.randomUUID(), project: project.trim(), tags: tags.trim(), note: note.trim() }])
    setEditingNoteId(null)
    setProject('')
    setTags('')
    setNote('')
  }

  const clearLocalData = () => {
    safeLocalStorageDelete(STORAGE_KEYS.messages, STORAGE_KEYS.conversations, STORAGE_KEYS.notes)
    setConversations([])
    setActiveId(null)
    setProjectNotes([])
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
      <p className="small">Talking with {companionName || 'Friend'} · {conversations.find((item) => item.id === activeId)?.title ?? 'New conversation'}</p>
      <p className="small">Messages save automatically in this browser with your local date and time.</p>
      <button type="button" onClick={() => setActiveId(null)}>New conversation</button>{' '}
      <a href="#/history">View history</a>
      <p className="small">{disclosureText}</p>
      <p className="small">{crisisGuidance}</p>
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

      <div className="chat-box" role="log" aria-live="polite" aria-relevant="additions text">
        {messages.length === 0 ? (
          <p className="small">No messages yet. Start with a topic starter or your own question.</p>
        ) : (
          <ul>
            {messages.map((msg) => (
              <li key={msg.id} className={msg.role === 'assistant' ? 'assistant' : 'user'}>
                <strong>{msg.role === 'assistant' ? (companionName || 'Friend') : 'You'}:</strong> {msg.text}
                {msg.createdAt && <time className="message-time" dateTime={msg.createdAt}>{formatTime(msg.createdAt)}</time>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="input-row">
        <input
          aria-label="Message input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Share what’s on your mind or your project."
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!hasConsent || (todayUserMessages >= entitlements.usageLimits.dailyMessages && !isCrisisText(input))}
        >
          Send
        </button>
      </div>
      <p className="small">
        Daily message usage: {todayUserMessages}. Free plan limit per day:{' '}
        {entitlements.usageLimits.dailyMessages}.
      </p>
      {todayUserMessages >= entitlements.usageLimits.dailyMessages && (
        <p className="warn">You reached today’s message limit. Crisis guidance remains available. Paid plans are previews until billing is implemented.</p>
      )}

      <h3>Creative project memory (local fallback)</h3>
      <p className="small">
        Keep only non-sensitive preferences, approved project notes, and creative context. Limit: {entitlements.usageLimits.projectNotesLimit} notes for your current plan.
      </p>
      <div className="grid">
        <label>
          Project name
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project name" />
        </label>
        <label>
          Project tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags: mood, style, deadline"
          />
        </label>
      </div>
      <label>
        Project note
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Project note / idea spark / check-in"
        />
      </label>
      <button type="button" onClick={addProjectNote}>
        {editingNoteId ? 'Save changes' : 'Save project note'}
      </button>
      {editingNoteId && <button type="button" onClick={() => {
        setEditingNoteId(null); setProject(''); setTags(''); setNote('')
      }}>Cancel edit</button>}
      <ul>
        {visibleProjectNotes.map((item) => (
          <li key={item.id}>
            <strong>{item.project}</strong> [{item.tags || 'untagged'}]: {item.note}
            <div className="history-actions">
              <button type="button" onClick={() => {
                setEditingNoteId(item.id); setProject(item.project); setTags(item.tags); setNote(item.note)
              }}>Edit note</button>
              <button type="button" onClick={() => {
                if (!window.confirm('Delete this project note?')) return
                setProjectNotes((current) => current.filter((entry) => entry.id !== item.id))
                if (editingNoteId === item.id) { setEditingNoteId(null); setProject(''); setTags(''); setNote('') }
              }}>Delete note</button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={clearLocalData}>
        Clear local chat + project data
      </button>
    </section>
  )

  const renderHistory = () => (
    <section className="panel">
      <h2>Conversation history</h2>
      <p className="small">Saved in this browser only. Rename, continue, or delete each conversation.</p>
      <label>Search conversations
        <input type="search" value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Search titles and messages" />
      </label>
      <button type="button" onClick={() => { setActiveId(null); window.location.hash = '/chat' }}>New conversation</button>
      {conversations.length === 0 ? <p>No conversations saved yet.</p> : (
        <ul className="history-list">
          {filteredConversations.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong> <span className="small">({item.messages.length} messages) · Updated <time dateTime={item.updatedAt}>{formatTime(item.updatedAt)}</time></span>
              <div className="history-actions">
                <button type="button" onClick={() => { setActiveId(item.id); window.location.hash = '/chat' }}>Continue</button>
                <button type="button" onClick={() => {
                  const title = window.prompt('Conversation name', item.title)?.trim()
                  if (title) setConversations((current) => current.map((conversation) =>
                    conversation.id === item.id ? { ...conversation, title: title.slice(0, 80) } : conversation))
                }}>Rename</button>
                <button type="button" onClick={() => {
                  if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
                  setConversations((current) => current.filter((conversation) => conversation.id !== item.id))
                  if (activeId === item.id) setActiveId(null)
                }}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {conversations.length > 0 && filteredConversations.length === 0 && <p>No matching conversations.</p>}
    </section>
  )

  const renderSetup = () => (
    <section className="panel">
      <h2>Companion settings</h2>
      <p>Choose the name you see in chat. This setting is stored in this browser.</p>
      <label>Companion name
        <input maxLength={40} value={companionName} onChange={(event) => setCompanionName(event.target.value)} />
      </label>
      <p className="small">Your companion is AI software. The current chat uses fixed local replies while a live service is being built.</p>
    </section>
  )

  const renderPricing = () => (
    <section className="panel">
      <h2>Pricing & Subscription</h2>
      <p>
        Pricing below is production-minded and configurable. If billing credentials are missing, this screen stays
        in safe preview mode.
      </p>
      <p className="warn">{billing.setupMessage} No payment or paid access is available yet.</p>
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
            <button
              type="button"
              aria-label={`Choose ${plan.name}`}
              aria-current={previewPlanId === plan.id}
              onClick={() => {
                setPreviewPlanId(plan.id)
              }}
            >
              {previewPlanId === plan.id ? 'Viewing plan' : 'Preview plan'}
            </button>
          </article>
        ))}
      </div>
      <p className="small">
        Active plan: Free Friend. Viewing: {previewPlanId}. Paid access requires server-verified billing. Safety disclosures, privacy controls, and crisis guidance stay available to everyone.
      </p>
    </section>
  )

  const renderPrivacy = () => (
    <section className="panel">
      <h2>Privacy Centre</h2>
      <ul>
        <li>Encryption in transit uses HTTPS/TLS when deployed.</li>
        <li>Local Chat uses fixed responses and saves to this browser. The separate Account & AI chat sends messages to the configured cloud database and AI provider when enabled.</li>
        <li>{cloudConfigured ? 'Cloud mode is configured. Delete local data here; export or delete cloud data from Account & AI chat.' : 'Cloud mode is not configured. Account & AI chat requires a Supabase project and deployed functions.'}</li>
        <li>Never enter provider secrets into browser environment variables.</li>
        <li>You can clear chat history and creative notes locally at any time.</li>
        <li>Data collection should stay minimal and purpose-limited.</li>
        <li>Cloud AI chat sends your messages to the configured AI provider for a response; local Chat does not.</li>
      </ul>
      <p>
        AI Friendship is not legally privileged communication, not a therapist, and not absolute confidentiality.
      </p>
      <p className="warn">
        Production launch still requires: security review, access controls, logging policy, retention policy, and
        provider data-processing/legal review.
      </p>
      <button type="button" onClick={clearLocalData}>
        Delete my local memory + history
      </button>
      <button type="button" onClick={() => downloadLocalData({ companionName, conversations, projectNotes })}>
        Download my local data (JSON)
      </button>
      <button type="button" onClick={() => {
        if (!window.confirm('Delete all AI Friendship data stored in this browser?')) return
        clearLocalData()
        safeLocalStorageDelete(STORAGE_KEYS.consent, STORAGE_KEYS.plan, STORAGE_KEYS.profile)
        setHasConsent(false)
        setPreviewPlanId('free')
        setCompanionName('Friend')
      }}>Delete all local app data</button>
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
    case '/cloud':
      page = <CloudChat />
      break
    case '/history':
      page = renderHistory()
      break
    case '/setup':
      page = renderSetup()
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
    default:
      page = renderHome()
      break
  }

  return (
    <div className="shell">
      <header>
        <h1>AI Friendship V1+</h1>
        <nav>
          <a href="#/">Home</a>
          <a href="#/chat">Chat</a>
          <a href="#/cloud">Account & AI chat</a>
          <a href="#/history">History</a>
          <a href="#/setup">Settings</a>
          <a href="#/pricing">Pricing</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/immersive">Immersive</a>
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
