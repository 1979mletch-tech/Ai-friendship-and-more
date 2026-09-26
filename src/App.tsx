import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getSubscriptionState } from './services/subscriptionService'
import type { PlanId } from './types/subscription'
import { applyProjectNotesLimit, getEntitlements, plans } from './utils/entitlements'
import { disclosureText, getAssistantResponse, isCrisisText as isCrisisTextForClient } from './utils/safety'
import { safeLocalStorageDelete, safeLocalStorageGet, safeLocalStorageSet } from './utils/storage'
import { hasCloudAuth } from './config/cloud'
import { deleteAccount, loadSession, requestPasswordReset, saveSession, signIn, signOut, signUp, type AuthSession } from './services/authService'
import { sendCloudChat } from './services/chatService'
import { backupConversation, backupMemoryItems } from './services/cloudSyncService'

type Route = '/' | '/chat' | '/history' | '/memory' | '/settings' | '/account' | '/pricing' | '/privacy' | '/immersive'
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
  memory: 'ai_friendship_memory',
  companionName: 'ai_friendship_companion_name',
}

const parseRoute = (): Route => {
  const hash = window.location.hash.replace('#', '') || '/'
  if (hash === '/chat' || hash === '/history' || hash === '/memory' || hash === '/settings' || hash === '/account' || hash === '/pricing' || hash === '/privacy' || hash === '/immersive') {
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
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authStatus, setAuthStatus] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [chatStatus, setChatStatus] = useState('')
  const [hasConsent, setHasConsent] = useState<boolean>(() =>
    safeLocalStorageGet(STORAGE_KEYS.consent, false),
  )
  const [planId, setPlanId] = useState<PlanId>(() => normalizePlanId(safeLocalStorageGet(STORAGE_KEYS.plan, 'free')))
  const [chatMode, setChatMode] = useState<ChatMode>('general')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    safeLocalStorageGet(STORAGE_KEYS.messages, []),
  )
  const [companionName, setCompanionName] = useState<string>(() => safeLocalStorageGet(STORAGE_KEYS.companionName, 'Friend'))
  const [memoryItems, setMemoryItems] = useState<string[]>(() => safeLocalStorageGet(STORAGE_KEYS.memory, []))
  const [memoryDraft, setMemoryDraft] = useState('')
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
  const todayUserMessages = messages.filter(
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
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.plan, planId), [planId])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.messages, messages), [messages])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.notes, projectNotes), [projectNotes])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.memory, memoryItems), [memoryItems])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.companionName, companionName), [companionName])

  const sendMessage = async () => {
    if (!input.trim() || !hasConsent || isSending) return
    const userText = input.trim().slice(0, 2000)
    if (todayUserMessages >= entitlements.usageLimits.dailyMessages) return

    let response = getAssistantResponse(userText, chatMode)
    const localDayKey = getLocalDayKey(new Date())
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', text: userText,
      createdAt: new Date().toISOString(), dayKey: localDayKey,
    }

    if (session && !isCrisisTextForClient(userText)) {
      setIsSending(true)
      setChatStatus('AI is responding…')
      try {
        const cloud = await sendCloudChat(
          session,
          [...messages, userMessage].map((m) => ({ role: m.role, text: m.text })),
          chatMode,
          companionName,
        )
        response = cloud.reply
        setChatStatus('')
      } catch {
        response = getAssistantResponse(userText, chatMode) + ' Live AI is unavailable, so this is the local fallback response.'
        setChatStatus('Live AI was unavailable. A local fallback response was used.')
      } finally {
        setIsSending(false)
      }
    }

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: response,
        createdAt: new Date().toISOString(),
        dayKey: localDayKey,
      },
    ])
    setInput('')
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
    safeLocalStorageDelete(STORAGE_KEYS.messages, STORAGE_KEYS.notes, STORAGE_KEYS.memory)
    setMessages([])
    setProjectNotes([])
    setMemoryItems([])
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
      <p className="small">{disclosureText}</p>
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
                <strong>{msg.role === 'assistant' ? companionName : 'You'}:</strong> {msg.text}
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
          maxLength={2000}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() } }}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!hasConsent || isSending || todayUserMessages >= entitlements.usageLimits.dailyMessages}
        >
          Send
        </button>
      </div>
      {chatStatus && <p className="small" role="status" aria-live="polite">{chatStatus}</p>}
      <p className="small">
        Daily message usage: {todayUserMessages}. Plan limit per day:{' '}
        {entitlements.usageLimits.dailyMessages}.
      </p>
      {todayUserMessages >= entitlements.usageLimits.dailyMessages && (
        <p className="warn">You reached today’s message limit for this plan. Try again tomorrow or choose Pro.</p>
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
            <strong>{item.project}</strong> [{item.tags || 'untagged'}]: {item.note}
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
      <h2>Conversation History</h2>
      <p className="small">History is stored on this device in the current preview build. Production account sync is not enabled yet.</p>
      {messages.length === 0 ? <p>No saved messages yet.</p> : (
        <ul className="history-list">
          {messages.map((msg) => (
            <li key={msg.id}>
              <strong>{msg.role === 'assistant' ? companionName : 'You'}</strong>
              <span>{msg.text}</span>
              <small>{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Saved locally'}</small>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => { safeLocalStorageDelete(STORAGE_KEYS.messages); setMessages([]) }}>
        Clear conversation history
      </button>
    </section>
  )

  const renderMemory = () => (
    <section className="panel">
      <h2>Memory</h2>
      <p>Choose what {companionName} may remember. Memory is user-controlled and local-only in this preview.</p>
      <div className="input-row">
        <input aria-label="Memory item" value={memoryDraft} onChange={(e) => setMemoryDraft(e.target.value)} placeholder="Example: I am writing a novel" maxLength={240} />
        <button type="button" onClick={() => {
          const value = memoryDraft.trim()
          if (!value || memoryItems.includes(value)) return
          setMemoryItems((current) => [...current, value].slice(-50))
          setMemoryDraft('')
        }}>Remember this</button>
      </div>
      {memoryItems.length === 0 ? <p className="small">Nothing saved to memory.</p> : (
        <ul className="memory-list">{memoryItems.map((item) => (
          <li key={item}><span>{item}</span><button type="button" onClick={() => setMemoryItems((current) => current.filter((value) => value !== item))}>Forget</button></li>
        ))}</ul>
      )}
      <button type="button" onClick={() => setMemoryItems([])}>Clear all memory</button>
    </section>
  )

  const renderSettings = () => (
    <section className="panel">
      <h2>Companion Settings</h2>
      <label>
        Companion name
        <input value={companionName} maxLength={32} onChange={(e) => setCompanionName(e.target.value.replace(/[<>]/g, '').slice(0, 32))} />
      </label>
      <p className="small">AI Friendship always remains clearly identified as AI even when you choose a companion name.</p>
      <h3>Data controls</h3>
      <p className="small">Deleting local data removes chat, project notes and memory from this browser. It does not claim to delete data from external providers.</p>
      <button type="button" onClick={clearLocalData}>Delete local chat, memory + project data</button>
      <h3>Account status</h3>
      <p className="warn">Account sign-in and cloud sync are not enabled in this preview build. Do not treat this device-only storage as a private account vault.</p>
    </section>
  )


  const renderAccount = () => (
    <section className="panel">
      <h2>Account</h2>
      {!hasCloudAuth() ? (
        <p className="warn">Cloud accounts are not configured on this deployment yet. Local preview features remain available.</p>
      ) : session ? (
        <>
          <p>Signed in as <strong>{session.user.email}</strong>.</p>
          <p className="small">Cloud-backed features must still pass two-account isolation testing before production use.</p>
          <div className="account-actions">
            <button type="button" onClick={async () => {
              try {
                await backupConversation(session, 'AI Friendship conversation', chatMode, messages)
                setAuthStatus('Conversation backed up to your cloud account.')
              } catch { setAuthStatus('Cloud conversation backup failed. Your local data is unchanged.') }
            }}>Back up conversation</button>
            <button type="button" onClick={async () => {
              try {
                await backupMemoryItems(session, memoryItems)
                setAuthStatus('Approved memory backed up to your cloud account.')
              } catch { setAuthStatus('Cloud memory backup failed. Your local data is unchanged.') }
            }}>Back up approved memory</button>
            <button type="button" onClick={async () => {
              await signOut(session)
              setSession(null)
              setAuthStatus('Signed out.')
            }}>Sign out</button>
            <button className="danger" type="button" onClick={async () => {
              const confirmed = window.confirm('Permanently delete this AI Friendship account and its cloud data?')
              if (!confirmed) return
              try {
                await deleteAccount(session)
                setSession(null)
                clearLocalData()
                setAuthStatus('Account deleted.')
              } catch { setAuthStatus('Account deletion failed. Local data was not cleared.') }
            }}>Delete account permanently</button>
          </div>
          {authStatus && <p className="small" role="status">{authStatus}</p>
        </>
      ) : (
        <>
          <label>Email<input type="email" autoComplete="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></label>
          <label>Password<input type="password" autoComplete="current-password" minLength={8} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></label>
          <div className="starters">
            <button type="button" onClick={async () => {
              try { const next = await signIn(authEmail.trim(), authPassword); if (next) { saveSession(next); setSession(next); setAuthStatus('Signed in.') } }
              catch (error) { setAuthStatus(error instanceof Error ? error.message : 'Sign in failed.') }
            }}>Sign in</button>
            <button type="button" onClick={async () => {
              try { const next = await signUp(authEmail.trim(), authPassword); if (next) { saveSession(next); setSession(next); setAuthStatus('Account created and signed in.') } else setAuthStatus('Account created. Check your email if confirmation is required.') }
              catch (error) { setAuthStatus(error instanceof Error ? error.message : 'Registration failed.') }
            }}>Create account</button>
            <button type="button" onClick={async () => {
              try { await requestPasswordReset(authEmail.trim()); setAuthStatus('If that account exists, recovery instructions have been requested.') }
              catch { setAuthStatus('Unable to request recovery right now.') }
            }}>Forgot password</button>
          </div>
          {authStatus && <p className="small" role="status">{authStatus}</p>}
        </>
      )}
    </section>
  )

  const renderPricing = () => (
    <section className="panel">
      <h2>Pricing & Subscription</h2>
      <p>
        Pricing below is production-minded and configurable. If billing credentials are missing, this screen stays
        in safe preview mode.
      </p>
      <p className={billing.isConfigured ? 'good' : 'warn'}>{billing.setupMessage}</p>
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
              aria-current={planId === plan.id}
              onClick={() => {
                setPlanId(plan.id)
                setProjectNotes((current) => applyProjectNotesLimit(current, plan.id))
              }}
            >
              {planId === plan.id ? 'Current plan' : 'Choose plan'}
            </button>
          </article>
        ))}
      </div>
      <p className="small">
        Current plan: {planId}. Safety disclosures, privacy controls, and crisis guidance stay available to all plans.
      </p>
    </section>
  )

  const renderPrivacy = () => (
    <section className="panel">
      <h2>Privacy Centre</h2>
      <ul>
        <li>Encryption in transit uses HTTPS/TLS when deployed.</li>
        <li>Secrets must stay in environment variables, never hard-coded.</li>
        <li>You can clear chat history and creative notes locally at any time.</li>
        <li>Data collection should stay minimal and purpose-limited.</li>
        <li>AI/database providers may process data per their terms and configuration.</li>
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
    case '/history':
      page = renderHistory()
      break
    case '/memory':
      page = renderMemory()
      break
    case '/settings':
      page = renderSettings()
      break
    case '/account':
      page = renderAccount()
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
          <a href="#/history">History</a>
          <a href="#/memory">Memory</a>
          <a href="#/settings">Settings</a>
          <a href="#/account">Account</a>
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
