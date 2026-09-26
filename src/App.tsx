import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getSubscriptionState } from './services/subscriptionService'
import type { PlanId } from './types/subscription'
import { applyProjectNotesLimit, getEntitlements, plans } from './utils/entitlements'
import { disclosureText } from './utils/safety'
import { getCompanionReply } from './services/replyOrchestrator'
import { normalizeEmail, isPlausibleEmail, passwordIssue } from './utils/accountValidation'
import { downloadDataExport } from './utils/downloadExport'
import { MAX_MESSAGE_LENGTH, validateMessage } from './utils/messageValidation'
import { billingApi } from './services/billingApi'
import { trustedRedirect } from './utils/redirectPolicy'
import { companionProfileApi } from './services/companionProfileApi'
import { sanitizeCompanionProfile } from './utils/companionProfile'
import { sanitizeMemory, removeMemory, type MemoryItem } from './utils/memoryStore'
import { memoryApi } from './services/memoryApi'
import { privacyApi } from './services/privacyApi'
import { loadRemoteConversations } from './services/conversationSync'
import { conversationApi } from './services/conversationApi'
import { getSafeServerReply } from './services/safeServerReply'
import { syncLabel, type SyncState } from './utils/syncState'
import { appendExchange, newLocalConversation, type LocalConversation } from './utils/chatPersistence'
import { migrateConversations } from './utils/conversationMigration'
import { authApi, type Session } from './services/apiClient'
import { readAppEnv } from './config/env'
import { safeLocalStorageDelete, safeLocalStorageGet, safeLocalStorageSet } from './utils/storage'

type Route = '/' | '/account' | '/setup' | '/chat' | '/memory' | '/settings' | '/pricing' | '/privacy' | '/immersive'
type ChatMode = 'general' | 'creative'
type CompanionProfile = { name: string; tone: 'warm' | 'calm' | 'upbeat'; interests: string }

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
  companion: 'ai_friendship_companion_profile',
  session: 'ai_friendship_session',
  conversations: 'ai_friendship_conversations',
  activeConversation: 'ai_friendship_active_conversation',
  memories: 'ai_friendship_memories',
}

const parseRoute = (): Route => {
  const hash = window.location.hash.replace('#', '') || '/'
  if (hash === '/account' || hash === '/setup' || hash === '/chat' || hash === '/memory' || hash === '/settings' || hash === '/pricing' || hash === '/privacy' || hash === '/immersive') {
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
  const [session, setSession] = useState<Session | null>(() => safeLocalStorageGet(STORAGE_KEYS.session, null))
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)
  const [chatError, setChatError] = useState('')
  const [billingBusy, setBillingBusy] = useState(false)
  const [billingError, setBillingError] = useState('')
  const [syncStatus, setSyncStatus] = useState<SyncState>('local')
  const [hasConsent, setHasConsent] = useState<boolean>(() =>
    safeLocalStorageGet(STORAGE_KEYS.consent, false),
  )
  const [planId, setPlanId] = useState<PlanId>(() => normalizePlanId(safeLocalStorageGet(STORAGE_KEYS.plan, 'free')))
  const [chatMode, setChatMode] = useState<ChatMode>('general')
  const [companion, setCompanion] = useState<CompanionProfile>(() => safeLocalStorageGet(STORAGE_KEYS.companion, { name: 'Friend', tone: 'warm', interests: '' }))
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState<LocalConversation[]>(() => migrateConversations(safeLocalStorageGet(STORAGE_KEYS.conversations, []), safeLocalStorageGet(STORAGE_KEYS.messages, [])))
  const [activeConversationId, setActiveConversationId] = useState<string>(() => safeLocalStorageGet(STORAGE_KEYS.activeConversation, 'default'))
  const messages: ChatMessage[] = conversations.find((item) => item.id === activeConversationId)?.messages || []
  const [memoryLabel, setMemoryLabel] = useState('')
  const [memoryValue, setMemoryValue] = useState('')
  const [memories, setMemories] = useState<MemoryItem[]>(() => safeLocalStorageGet(STORAGE_KEYS.memories, []))
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
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.plan, planId), [planId])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.conversations, conversations), [conversations])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.activeConversation, activeConversationId), [activeConversationId])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.notes, projectNotes), [projectNotes])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.memories, memories), [memories])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.companion, companion), [companion])
  useEffect(() => { if (session) safeLocalStorageSet(STORAGE_KEYS.session, session); else safeLocalStorageDelete(STORAGE_KEYS.session) }, [session])
  useEffect(() => {
    const env = readAppEnv()
    if (!session || env.authMode !== 'server' || !env.apiBaseUrl) { setSyncStatus('local'); return }
    let mounted = true
    setSyncStatus('syncing')
    void Promise.all([loadRemoteConversations(session), memoryApi.list(session), companionProfileApi.get(session)])
      .then(([remoteConversations, remoteMemories, remoteCompanion]) => {
        if (!mounted) return
        setConversations(remoteConversations)
        setMemories(remoteMemories)
        setCompanion(sanitizeCompanionProfile(remoteCompanion))
        if (remoteConversations.length) setActiveConversationId((current) => remoteConversations.some((item) => item.id === current) ? current : remoteConversations[0].id)
        setSyncStatus('synced')
      })
      .catch(() => { if (mounted) setSyncStatus('error') })
    return () => { mounted = false }
  }, [session])

  const newConversation = () => {
    const id = crypto.randomUUID()
    setConversations((current) => [newLocalConversation(id), ...current])
    setActiveConversationId(id)
    window.location.hash = '/chat'
  }

  const deleteConversation = (id: string) => {
    setConversations((current) => current.filter((item) => item.id !== id))
    if (activeConversationId === id) { setActiveConversationId('default') }
  }

  const sendMessage = async () => {
    if (!input.trim() || !hasConsent) return
    const userText = input.trim()
    const messageIssue = validateMessage(userText)
    if (messageIssue) { setChatError(messageIssue); return }
    if (todayUserMessages >= entitlements.usageLimits.dailyMessages) return

    if (chatBusy) return
    setChatBusy(true); setChatError('')
    let response: string
    let persistedConversationId = activeConversationId
    try {
      const env = readAppEnv()
      if (session && env.authMode === 'server' && env.apiBaseUrl) {
        let serverConversationId = activeConversationId
        if (!conversations.some((item) => item.id === activeConversationId)) {
          const created = await conversationApi.create(session)
          serverConversationId = created.id
          persistedConversationId = created.id
          setActiveConversationId(created.id)
        }
        response = await getSafeServerReply({ session, conversationId: serverConversationId, text: userText, mode: chatMode })
      } else {
        response = await getCompanionReply({ text: userText, mode: chatMode, session, conversationId: activeConversationId })
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'The companion reply could not be completed.')
      setChatBusy(false)
      return
    }
    setConversations((current) => {
      const effectiveId = persistedConversationId
      const existing = current.find((item) => item.id === effectiveId) || newLocalConversation(effectiveId)
      const updated = appendExchange(existing, userText, response)
      return [updated, ...current.filter((item) => item.id !== activeConversationId)]
    })
    setInput('')
    setChatBusy(false)
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

  const clearLocalData = async () => {
    const env = readAppEnv()
    if (session && env.authMode === 'server' && env.apiBaseUrl) {
      try { await Promise.all([privacyApi.clearConversations(session), privacyApi.clearMemories(session)]) } catch { setChatError('Server data could not be cleared. Nothing was silently claimed deleted.'); return }
    }
    safeLocalStorageDelete(STORAGE_KEYS.messages, STORAGE_KEYS.notes, STORAGE_KEYS.memories, STORAGE_KEYS.conversations, STORAGE_KEYS.activeConversation)
    setProjectNotes([])
    setMemories([])
    setConversations([])
    setActiveConversationId('default')
  }

  const runAuth = async (kind: 'login' | 'register') => {
    const env = readAppEnv()
    if (env.authMode !== 'server' || !env.apiBaseUrl) {
      setAuthError('Account server is not configured yet. Local preview remains available without pretending you are signed in.')
      return
    }
    const email = normalizeEmail(authEmail)
    if (!isPlausibleEmail(email)) { setAuthError('Enter a valid email address.'); return }
    const issue = passwordIssue(authPassword)
    if (issue) { setAuthError(issue); return }
    setAuthBusy(true); setAuthError('')
    try {
      const next = kind === 'login'
        ? await authApi.signIn(email, authPassword)
        : await authApi.signUp(email, authPassword, authName.trim())
      setSession(next); setAuthPassword(''); window.location.hash = '/setup'
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Sign in failed.') }
    finally { setAuthBusy(false) }
  }

  const deleteAccount = async () => {
    if (!session) return
    if (!window.confirm('Delete your account and local AI Friendship data? This cannot be undone.')) return
    setAuthBusy(true); setAuthError('')
    try {
      await authApi.deleteAccount(session.accessToken)
      safeLocalStorageDelete(STORAGE_KEYS.session, STORAGE_KEYS.messages, STORAGE_KEYS.notes, STORAGE_KEYS.memories, STORAGE_KEYS.conversations, STORAGE_KEYS.activeConversation, STORAGE_KEYS.companion)
      setSession(null); setProjectNotes([]); setMemories([]); setConversations([]); setActiveConversationId('default')
      window.location.hash = '/'
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Account deletion failed.') }
    finally { setAuthBusy(false) }
  }

  const signOut = async () => {
    if (session) { try { await authApi.signOut(session.accessToken) } catch { /* clear local session regardless */ } }
    setSession(null)
  }

  const renderAccount = () => (
    <section className="panel">
      <h2>Account</h2>
      {session ? (<>
        <p>Signed in as <strong>{session.user.displayName || session.user.email}</strong></p>
        <button type="button" onClick={signOut}>Sign out</button>{' '}
        <button type="button" disabled={authBusy} onClick={deleteAccount}>Delete account</button>
        {authError && <p className="warn" role="alert">{authError}</p>}
      </>) : (<>
        <p className="small">Create an account or sign in when the secure server is configured. Passwords are never placed in URLs.</p>
        <div className="grid">
          <label>Display name<input value={authName} onChange={(e) => setAuthName(e.target.value)} autoComplete="name" /></label>
          <label>Email<input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} autoComplete="email" /></label>
          <label>Password<input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} autoComplete="current-password" /></label>
        </div>
        <div className="starters">
          <button type="button" disabled={authBusy || !authEmail || !authPassword} onClick={() => runAuth('login')}>Sign in</button>
          <button type="button" disabled={authBusy || !authEmail || !authPassword} onClick={() => runAuth('register')}>Create account</button>
        </div>
        {authError && <p className="warn" role="alert">{authError}</p>}
      </>)}
    </section>
  )

  const saveCompanion = async () => {
    const safe = sanitizeCompanionProfile(companion)
    setCompanion(safe)
    const env = readAppEnv()
    if (session && env.authMode === 'server' && env.apiBaseUrl) {
      try { setCompanion(await companionProfileApi.save(session, safe)) } catch { /* local copy remains available */ }
    }
    window.location.hash = '/chat'
  }

  const renderSetup = () => (
    <section className="panel">
      <h2>Set up your companion</h2>
      <p>Choose how your AI companion feels to talk with. You can change this later. AI Friendship always remains clearly identified as AI.</p>
      <div className="grid">
        <label>Companion name
          <input value={companion.name} maxLength={30} onChange={(e) => setCompanion({ ...companion, name: e.target.value })} placeholder="Friend" />
        </label>
        <label>Conversation tone
          <select value={companion.tone} onChange={(e) => setCompanion({ ...companion, tone: e.target.value as CompanionProfile['tone'] })}>
            <option value="warm">Warm</option><option value="calm">Calm</option><option value="upbeat">Upbeat</option>
          </select>
        </label>
      </div>
      <label>Things you enjoy talking about
        <textarea value={companion.interests} maxLength={300} onChange={(e) => setCompanion({ ...companion, interests: e.target.value })} placeholder="Music, films, books, everyday life, creative projects…" />
      </label>
      <button type="button" onClick={() => { void saveCompanion() }}>Save & start chatting</button>
      <p className="small">This setup is stored locally in preview mode. It does not make the companion human or create an exclusive relationship.</p>
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
      <h2>{companion.name || 'Friend'} — Companion Chat</h2>
      <p className="small" aria-live="polite">Data mode: {syncLabel(syncStatus)}</p>
      <div className="starters"><button type="button" onClick={newConversation}>New conversation</button></div>
      {conversations.length > 0 && <div><h3>Conversation history</h3><ul>{conversations.map((item) => <li key={item.id}><button type="button" onClick={() => setActiveConversationId(item.id)}>{item.title}</button>{' '}<button type="button" onClick={() => deleteConversation(item.id)}>Delete</button></li>)}</ul></div>}
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

      <p className="small">Active conversation: <strong>{conversations.find((item) => item.id === activeConversationId)?.title || 'New conversation'}</strong></p>
      <div className="chat-box" role="log" aria-live="polite" aria-relevant="additions text">
        {messages.length === 0 ? (
          <p className="small">No messages yet. Start with a topic starter or your own question.</p>
        ) : (
          <ul>
            {messages.map((msg) => (
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
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={chatBusy || !hasConsent || todayUserMessages >= entitlements.usageLimits.dailyMessages}
        >
          Send
        </button>
      </div>
      {chatError && <p className="warn" role="alert">{chatError}</p>}
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
      <button type="button" onClick={() => { void clearLocalData() }}>
        Clear local chat + project data
      </button>
    </section>
  )

  const deleteNote = (id: string) => setProjectNotes((current) => current.filter((item) => item.id !== id))
  const addMemory = async () => { if (!memoryLabel.trim() || !memoryValue.trim()) return; const local = sanitizeMemory(memoryLabel, memoryValue); const env = readAppEnv(); try { if (session && env.authMode === 'server' && env.apiBaseUrl) { const saved = await memoryApi.save(session, local.label, local.value); setMemories((current) => [saved, ...current]) } else setMemories((current) => [local, ...current]); setMemoryLabel(''); setMemoryValue('') } catch { setMemories((current) => [local, ...current]); setMemoryLabel(''); setMemoryValue('') } }
  const forgetMemory = async (item: MemoryItem) => { const env = readAppEnv(); if (session && env.authMode === 'server' && env.apiBaseUrl) { try { await memoryApi.remove(session, item.id) } catch { return } } setMemories((current) => removeMemory(current, item.id)) }
  const forgetAllMemories = async () => { const env = readAppEnv(); if (session && env.authMode === 'server' && env.apiBaseUrl) { try { await memoryApi.clear(session) } catch { return } } safeLocalStorageDelete(STORAGE_KEYS.memories); setMemories([]) }

  const renderMemory = () => (
    <section className="panel">
      <h2>Your memory</h2>
      <p>You decide exactly what AI Friendship may remember. Memory is separate from conversation history and can be removed at any time.</p>
      <div className="grid">
        <label>Memory label<input value={memoryLabel} maxLength={60} onChange={(e) => setMemoryLabel(e.target.value)} placeholder="e.g. Favourite music" /></label>
        <label>What to remember<textarea value={memoryValue} maxLength={500} onChange={(e) => setMemoryValue(e.target.value)} placeholder="Only save something you want remembered." /></label>
      </div>
      <button type="button" onClick={() => { void addMemory() }} disabled={!memoryLabel.trim() || !memoryValue.trim()}>Remember this</button>
      {memories.length === 0 ? <p className="small">No approved memories saved.</p> : <ul>{memories.map((item) => <li key={item.id}><strong>{item.label}:</strong> {item.value}{' '}<button type="button" onClick={() => { void forgetMemory(item) }}>Forget this</button></li>)}</ul>}
      <button type="button" disabled={memories.length === 0} onClick={() => { void forgetAllMemories() }}>Forget all approved memories</button>
      <h3>Creative project notes</h3>
      {visibleProjectNotes.length === 0 ? <p className="small">No project notes saved.</p> : <ul>{visibleProjectNotes.map((item) => <li key={item.id}><strong>{item.project}</strong> [{item.tags || 'untagged'}]: {item.note}{' '}<button type="button" onClick={() => deleteNote(item.id)}>Delete note</button></li>)}</ul>}
    </section>
  )

  const renderSettings = () => (
    <section className="panel">
      <h2>Settings & data controls</h2>
      <p className="small">AI Friendship is always identified as AI. These controls affect data stored locally in this browser.</p>
      <label className="consent">
        <input type="checkbox" checked={hasConsent} onChange={(e) => setHasConsent(e.target.checked)} />
        Allow companion chat on this device
      </label>
      <p>Current plan: <strong>{planId}</strong></p>
      <button type="button" onClick={clearLocalData}>Delete local chat history + memory</button>
      <p className="warn">Deleting local data cannot be undone.</p>
    </section>
  )

  const startCheckout = async (nextPlan: Extract<PlanId, 'pro-monthly' | 'pro-annual'>) => {
    const env = readAppEnv()
    if (!session || env.authMode !== 'server' || !env.apiBaseUrl) { setBillingError('Sign in to a configured production account before starting checkout.'); return }
    setBillingBusy(true); setBillingError('')
    try { const result = await billingApi.checkout(session, nextPlan); window.location.assign(trustedRedirect(result.url, 'checkout')) }
    catch (error) { setBillingError(error instanceof Error ? error.message : 'Checkout could not be started.') }
    finally { setBillingBusy(false) }
  }

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
              disabled={billingBusy}
              onClick={() => {
                if (plan.id === 'free') { setPlanId('free'); setProjectNotes((current) => applyProjectNotesLimit(current, 'free')); return }
                void startCheckout(plan.id)
              }}
            >
              {planId === plan.id ? 'Current plan' : 'Choose plan'}
            </button>
          </article>
        ))}
      </div>
      {billingError && <p className="warn" role="alert">{billingError}</p>}
      <p className="small">
        Current plan: {planId}. Safety disclosures, privacy controls, and crisis guidance stay available to all plans.
      </p>
    </section>
  )

  const exportMyData = async () => { const env = readAppEnv(); if (session && env.authMode === 'server' && env.apiBaseUrl) { try { const remote = await privacyApi.exportData(session); downloadDataExport(companion, remote, { approvedMemories: memories, projectNotes }); return } catch { /* retain local export availability */ } } downloadDataExport(companion, conversations, { approvedMemories: memories, projectNotes }) }

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
      <div className="starters">
        <button type="button" onClick={() => { void exportMyData() }}>
          Export my local data
        </button>
        <button type="button" onClick={clearLocalData}>
          Delete my local memory + history
        </button>
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
    case '/account':
      page = renderAccount()
      break
    case '/setup':
      page = renderSetup()
      break
    case '/chat':
      page = renderChat()
      break
    case '/memory':
      page = renderMemory()
      break
    case '/settings':
      page = renderSettings()
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
          <a href="#/account">Account</a>
          <a href="#/setup">Companion setup</a>
          <a href="#/chat">Chat</a>
          <a href="#/memory">Memory</a>
          <a href="#/settings">Settings</a>
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
