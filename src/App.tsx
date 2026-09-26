import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { accountApi } from './services/account'
import type { Account } from './services/account'
import { getSubscriptionState } from './services/subscriptionService'
import type { PlanId } from './types/subscription'
import { applyProjectNotesLimit, getEntitlements, plans } from './utils/entitlements'
import { crisisGuidance, disclosureText, isCrisisText } from './utils/safety'
import { safeLocalStorageDelete, safeLocalStorageGet, safeLocalStorageSet } from './utils/storage'

type Route = '/' | '/chat' | '/pricing' | '/privacy' | '/immersive' | '/account'
type ChatMode = 'general' | 'creative'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt?: string
  dayKey?: string
}

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
  notes: 'ai_friendship_project_notes',
}

const parseRoute = (): Route => {
  const hash = window.location.hash.replace('#', '') || '/'
  if (hash === '/chat' || hash === '/pricing' || hash === '/privacy' || hash === '/immersive' || hash === '/account') {
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
  const [account, setAccount] = useState<Account | null>(null)
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [accountError, setAccountError] = useState('')
  const [accountBusy, setAccountBusy] = useState(false)
  const [serverMessages, setServerMessages] = useState<ChatMessage[]>([])
  const [hasConsent, setHasConsent] = useState<boolean>(() =>
    safeLocalStorageGet(STORAGE_KEYS.consent, false),
  )
  // Paid entitlements require a verified server subscription. Local selections are previews only.
  const [previewPlanId, setPreviewPlanId] = useState<PlanId>(() => normalizePlanId(safeLocalStorageGet(STORAGE_KEYS.plan, 'free')))
  const planId: PlanId = 'free'
  const [chatMode, setChatMode] = useState<ChatMode>('general')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    safeLocalStorageGet(STORAGE_KEYS.messages, []),
  )
  const visibleMessages = account ? serverMessages : messages
  const [project, setProject] = useState('')
  const [tags, setTags] = useState('')
  const [note, setNote] = useState('')
  const [projectNotes, setProjectNotes] = useState<ProjectNote[]>(() =>
    applyProjectNotesLimit(
      safeLocalStorageGet(STORAGE_KEYS.notes, []),
      normalizePlanId(safeLocalStorageGet(STORAGE_KEYS.plan, 'free')),
    ),
  )
  const [xrStatus, setXrStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')

  const billing = useMemo(() => getSubscriptionState(), [])
  const entitlements = useMemo(() => getEntitlements(planId), [planId])
  const visibleProjectNotes = useMemo(
    () => applyProjectNotesLimit(projectNotes, planId),
    [planId, projectNotes],
  )
  const today = getLocalDayKey(new Date())
  const todayUserMessages = visibleMessages.filter(
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
    accountApi.me().then(({ user }) => {
      if (user) {
        setAccount(user)
        accountApi.messages().then(({ messages }) => setServerMessages(messages)).catch(() => setAccountError('Could not load account history'))
      }
    }).catch(() => { /* API is optional during static preview */ })
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
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.messages, messages), [messages])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.notes, projectNotes), [projectNotes])

  const sendMessage = async () => {
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

    if (account) {
      try {
        const first = await accountApi.saveMessage('user', userText)
        setServerMessages((current) => [...current, first.message])
        setInput('')
        const second = await accountApi.saveMessage('assistant', response)
        setServerMessages((current) => [...current, second.message])
      } catch (error) {
        setAccountError(error instanceof Error ? error.message : 'Message could not be saved')
      }
    } else {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'user', text: userText, createdAt: new Date().toISOString(), dayKey: localDayKey },
        { id: crypto.randomUUID(), role: 'assistant', text: response, createdAt: new Date().toISOString(), dayKey: localDayKey },
      ])
      setInput('')
    }
  }

  const addProjectNote = () => {
    if (!project.trim() || !note.trim()) return
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
  }

  const exportLocalData = () => {
    const data = JSON.stringify({ exportedAt: new Date().toISOString(), messages: visibleMessages, projectNotes }, null, 2)
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-friendship-local-data-${getLocalDayKey(new Date())}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const authenticate = async (action: 'login' | 'register') => {
    setAccountBusy(true)
    setAccountError('')
    try {
      const { user } = await accountApi[action](accountEmail, accountPassword)
      const { messages: saved } = await accountApi.messages()
      setAccount(user)
      setServerMessages(saved)
      setAccountPassword('')
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Account request failed. Start the API server to use accounts.')
    } finally {
      setAccountBusy(false)
    }
  }

  const renderAccount = () => (
    <section className="panel">
      <h2>Account</h2>
      {account ? (
        <>
          <p>Signed in as {account.email}. Your chat history is stored in your account on this server. Local project notes remain in this browser.</p>
          <button type="button" onClick={async () => {
            try { await accountApi.logout(); setAccount(null); setServerMessages([]) }
            catch { setAccountError('Could not sign out') }
          }}>Sign out</button>
          <button type="button" onClick={async () => {
            if (!window.confirm('Delete this account and all its saved messages?')) return
            try { await accountApi.deleteAccount(); setAccount(null); setServerMessages([]) }
            catch { setAccountError('Could not delete account') }
          }}>Delete account and saved messages</button>
        </>
      ) : (
        <>
          <p>Create an account or sign in to keep chat history on the configured server. Local notes are still browser-only.</p>
          <label>Email <input type="email" autoComplete="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} /></label>
          <label>Password <input type="password" autoComplete="current-password" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} /></label>
          <div className="starters">
            <button type="button" disabled={accountBusy} onClick={() => authenticate('login')}>Sign in</button>
            <button type="button" disabled={accountBusy} onClick={() => authenticate('register')}>Create account</button>
          </div>
        </>
      )}
      {accountError && <p className="warn" role="alert">{accountError}</p>}
    </section>
  )

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
      <p className="small">{account ? `Signed in as ${account.email}; chat history is saved to this server.` : 'Guest chat is stored only in this browser. Sign in on the Account page for server-backed history.'}</p>
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
        {visibleMessages.length === 0 ? (
          <p className="small">No messages yet. Start with a topic starter or your own question.</p>
        ) : (
          <ul>
            {visibleMessages.map((msg) => (
              <li key={msg.id} className={msg.role === 'assistant' ? 'assistant' : 'user'}>
                <strong>{msg.role === 'assistant' ? 'Friend' : 'You'}:</strong> {msg.text}
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
        Save project note
      </button>
      <ul>
        {visibleProjectNotes.map((item) => (
          <li key={item.id}>
            <strong>{item.project}</strong> [{item.tags || 'untagged'}]: {item.note}{' '}
            <button type="button" aria-label={`Delete note for ${item.project}`} onClick={() => setProjectNotes((current) => current.filter((note) => note.id !== item.id))}>Delete note</button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={clearLocalData}>
        Clear local chat + project data
      </button>
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
        <li>Chat uses fixed responses, not a live AI service. Guest chat and project notes stay in this browser. When signed in, chat history is stored on the configured server.</li>
        <li>Never enter provider secrets into browser environment variables.</li>
        <li>You can export or clear your local chat and creative notes at any time. Store exported files securely.</li>
        <li>Data collection should stay minimal and purpose-limited.</li>
        <li>A future live AI service would send messages to its provider and require updated disclosures.</li>
      </ul>
      <p>
        AI Friendship is not legally privileged communication, not a therapist, and not absolute confidentiality.
      </p>
      <p className="warn">
        Production launch still requires: security review, access controls, logging policy, retention policy, and
        provider data-processing/legal review.
      </p>
      <div className="starters">
        <button type="button" onClick={exportLocalData}>Export my chat and local notes (JSON)</button>
        <button type="button" onClick={async () => {
          if (account) {
            try { await accountApi.deleteMessages(); setServerMessages([]) }
            catch { setAccountError('Could not delete saved messages') }
          } else setMessages([])
        }}>Delete {account ? 'saved' : 'local'} chat history</button>
        <button type="button" onClick={() => setProjectNotes([])}>Delete local project notes</button>
        <button type="button" onClick={clearLocalData}>Delete my local memory + history</button>
      </div>
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
    case '/account':
      page = renderAccount()
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
          <a href="#/pricing">Pricing</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/account">Account</a>
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
