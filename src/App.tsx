import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { getSubscriptionState } from './services/subscriptionService'
import type { PlanId } from './types/subscription'
import { applyProjectNotesLimit, getEntitlements, plans } from './utils/entitlements'
import { disclosureText, getAssistantResponse, isCrisisText as isCrisisTextForClient } from './utils/safety'
import { safeLocalStorageDelete, safeLocalStorageGet, safeLocalStorageSet } from './utils/storage'
import { hasCloudAuth } from './config/cloud'
import { deleteAccount, loadSession, requestPasswordReset, saveSession, signIn, signOut, signUp, type AuthSession } from './services/authService'
import { sendCloudChat } from './services/chatService'
import { backupConversation, backupMemoryItems } from './services/cloudSyncServiceV2'
import { createExportBundle, downloadJson } from './utils/exportData'
import { routeRequiresAdultGate } from './utils/adultRoutes'
import { accountDataKeys, accountDeletionKeys, localAccountKey } from './utils/localAccountScope'
import { previewActivePlan } from './utils/planGuard'
import { ChatRequestGate } from './utils/chatRequestGate'
import { removeHistoryTurn } from './utils/history'

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
  adultAccess: 'ai_aurora_adult_access',
}

const parseRoute = (): Route => {
  const hash = window.location.hash.replace('#', '') || '/'
  if (hash === '/chat' || hash === '/history' || hash === '/memory' || hash === '/settings' || hash === '/account' || hash === '/pricing' || hash === '/privacy' || hash === '/immersive') {
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
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authStatus, setAuthStatus] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const authBusyRef = useRef(false)
  const [adultAccess, setAdultAccess] = useState<boolean>(() => safeLocalStorageGet(STORAGE_KEYS.adultAccess, false))
  const [isSending, setIsSending] = useState(false)
  const chatGate = useRef(new ChatRequestGate())
  const [chatStatus, setChatStatus] = useState('')
  const [hasConsent, setHasConsent] = useState<boolean>(() =>
    safeLocalStorageGet(localAccountKey(STORAGE_KEYS.consent, session), false),
  )
  // No server-verified billing exists yet. Browser state cannot grant paid limits.
  const planId: PlanId = previewActivePlan(safeLocalStorageGet(STORAGE_KEYS.plan, 'free'))
  const [chatMode, setChatMode] = useState<ChatMode>('general')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    safeLocalStorageGet(localAccountKey(STORAGE_KEYS.messages, session), []),
  )
  const [companionName, setCompanionName] = useState<string>(() => safeLocalStorageGet(localAccountKey(STORAGE_KEYS.companionName, session), 'Friend'))
  const [memoryItems, setMemoryItems] = useState<string[]>(() => safeLocalStorageGet(localAccountKey(STORAGE_KEYS.memory, session), []))
  const [memoryDraft, setMemoryDraft] = useState('')
  const [historyQuery, setHistoryQuery] = useState('')
  const [project, setProject] = useState('')
  const [tags, setTags] = useState('')
  const [note, setNote] = useState('')
  const [projectNotes, setProjectNotes] = useState<ProjectNote[]>(() =>
    applyProjectNotesLimit(
      safeLocalStorageGet(localAccountKey(STORAGE_KEYS.notes, session), []),
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

  useEffect(() => safeLocalStorageSet(localAccountKey(STORAGE_KEYS.consent, session), hasConsent), [hasConsent, session])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.adultAccess, adultAccess), [adultAccess])
  useEffect(() => safeLocalStorageSet(STORAGE_KEYS.plan, 'free'), [])
  useEffect(() => safeLocalStorageSet(localAccountKey(STORAGE_KEYS.messages, session), messages), [messages, session])
  useEffect(() => safeLocalStorageSet(localAccountKey(STORAGE_KEYS.notes, session), projectNotes), [projectNotes, session])
  useEffect(() => safeLocalStorageSet(localAccountKey(STORAGE_KEYS.memory, session), memoryItems), [memoryItems, session])
  useEffect(() => safeLocalStorageSet(localAccountKey(STORAGE_KEYS.companionName, session), companionName), [companionName, session])

  const sendMessage = async () => {
    if (!adultAccess || !input.trim() || !hasConsent || isSending) return
    const userText = input.trim().slice(0, 2000)
    if (todayUserMessages >= entitlements.usageLimits.dailyMessages) return
    const generation = chatGate.current.begin()
    if (generation === null) return

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
        if (chatGate.current.isCurrent(generation)) setIsSending(false)
      }
    }

    if (!chatGate.current.isCurrent(generation)) return
    chatGate.current.finish(generation)

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
    setAuthPassword('')
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
    chatGate.current.invalidate()
    setIsSending(false)
    setChatStatus('')
    safeLocalStorageDelete(...accountDataKeys(session))
    setMessages([])
    setProjectNotes([])
    setMemoryItems([])
  }

  const activateSession = (next: AuthSession | null) => {
    chatGate.current.invalidate()
    setIsSending(false)
    setChatStatus('')
    setHasConsent(safeLocalStorageGet(localAccountKey(STORAGE_KEYS.consent, next), false))
    setCompanionName(safeLocalStorageGet(localAccountKey(STORAGE_KEYS.companionName, next), 'Friend'))
    setMessages(safeLocalStorageGet(localAccountKey(STORAGE_KEYS.messages, next), []))
    setProjectNotes(safeLocalStorageGet(localAccountKey(STORAGE_KEYS.notes, next), []))
    setMemoryItems(safeLocalStorageGet(localAccountKey(STORAGE_KEYS.memory, next), []))
    setInput('')
    setMemoryDraft('')
    setHistoryQuery('')
    setProject('')
    setTags('')
    setNote('')
    setSession(next)
  }

  const runAccountAction = async (action: () => Promise<void>) => {
    if (authBusyRef.current) return
    authBusyRef.current = true
    setAuthBusy(true)
    try { await action() }
    catch { setAuthStatus('The account action could not be completed. Please try again.') }
    finally { authBusyRef.current = false; setAuthBusy(false) }
  }

  const renderHome = () => (
    <section className="panel">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">MEET AI AURORA</p>
          <h1>Ideas glow brighter<br />when you’re not thinking alone.</h1>
          <p className="hero-lead">A warm AI companion for conversation, creativity and the moments when you need somewhere to think out loud.</p>
          <div className="hero-actions">
            <a className="primary-cta" href="#/chat">Talk to Aurora</a>
            <a className="secondary-cta" href="#/pricing">Explore plans</a>
          </div>
          <p className="trust-line">18+ interactive experience · AI companion · You control memory · Clear privacy controls</p>
        </div>
        <div className="aurora-stage" aria-hidden="true">
          <div className="aurora-glow aurora-glow-one" />
          <div className="aurora-glow aurora-glow-two" />
          <div className="aurora-orb"><span>A</span></div>
          <p>Always AI. Designed to feel easy to talk to.</p>
        </div>
      </div>
      <div className="home-intro">
        <p className="eyebrow">START WHERE YOU ARE</p>
        <h2>What would help right now?</h2>
      </div>
      <div className="starters">
        {['Help me break a creative block', 'Give me 3 songwriting ideas', 'Reflect on my week kindly', 'Plan my next focused hour'].map(
          (starter) => (
            <button key={starter} type="button" onClick={() => { window.location.hash = '/chat'; setChatMode('creative'); setInput(starter) }}>
              <span className="starter-icon">✦</span>{starter}<span aria-hidden="true">→</span>
            </button>
          ),
        )}
      </div>
      <section className="feature-strip" aria-label="AI Aurora highlights">
        <article><span>01</span><h3>Talk it through</h3><p>Conversation for everyday thoughts, decisions and reflection without pretending the AI is human.</p></article>
        <article><span>02</span><h3>Create with Aurora</h3><p>Move through creative blocks, develop ideas and keep useful project context close at hand.</p></article>
        <article><span>03</span><h3>Memory you control</h3><p>Choose what Aurora may remember, review it whenever you want and remove it when you are done.</p></article>
      </section>
      <section className="showcase">
        <div>
          <p className="eyebrow">BUILT AROUND YOU</p>
          <h2>One place to think, make and come back to.</h2>
          <p>Switch between everyday conversation and creative mode. Keep the pieces that matter. Leave behind the ones that do not.</p>
          <a className="text-link" href="#/memory">See memory controls →</a>
        </div>
        <div className="conversation-card">
          <p className="mini-label">CREATIVE MODE</p>
          <div className="sample user-sample">I have the beginning of an idea, but I can’t see where it goes.</div>
          <div className="sample aurora-sample"><strong>Aurora</strong><br />Tell me the part that still feels alive. We can explore a few directions without forcing it.</div>
        </div>
      </section>
      <section className="privacy-callout">
        <div><p className="eyebrow">CLEAR BY DESIGN</p><h2>Your conversation should come with controls.</h2></div>
        <p>AI Aurora keeps its AI identity visible, gives you direct memory and deletion controls, and separates preview features from services that still require live verification.</p>
        <a className="secondary-cta" href="#/privacy">Privacy centre</a>
      </section>
      <section className="final-cta">
        <div className="aurora-mini">A</div>
        <h2>There’s room here for the thought you haven’t finished yet.</h2>
        <p>Start a conversation, bring an idea, or simply think out loud.</p>
        <a className="primary-cta" href="#/chat">Start with Aurora</a>
      </section>
    </section>
  )

  const renderChat = () => (
    <section className="panel">
      {!adultAccess && <div className="adult-lock"><p className="eyebrow">ADULT ACCESS</p><h2>AI Aurora is an 18+ experience.</h2><p>You must be 18 or over to use the interactive companion. Aurora is presented as an adult AI persona (25+) and is never presented as a child or teenager.</p><button type="button" onClick={() => setAdultAccess(true)}>I confirm I am 18 or over</button><a href="#/">Leave interactive experience</a><p className="small">This confirmation is a preview control. Production launch requires the chosen proportionate age-assurance mechanism to be configured and verified.</p></div>}
      <div className={!adultAccess ? 'adult-protected' : ''} aria-hidden={!adultAccess}>
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
      </div>
    </section>
  )


  const renderHistory = () => (
    <section className="panel">
      <h2>Conversation History</h2>
      <p className="small">History is stored for this {session ? 'account' : 'guest'} in this browser. Cloud backup is manual; automatic sync is not enabled.</p>
      <label>Search history<input type="search" value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Search messages" /></label>
      <p className="small">{messages.filter((message) => message.text.toLocaleLowerCase().includes(historyQuery.trim().toLocaleLowerCase())).length} matching messages</p>
      {messages.length === 0 ? <p>No saved messages yet.</p> : messages.every((message) => !message.text.toLocaleLowerCase().includes(historyQuery.trim().toLocaleLowerCase())) ? <p>No messages match your search.</p> : (
        <ul className="history-list">
          {messages.filter((message) => message.text.toLocaleLowerCase().includes(historyQuery.trim().toLocaleLowerCase())).map((msg) => (
            <li key={msg.id}>
              <strong>{msg.role === 'assistant' ? companionName : 'You'}</strong>
              <span>{msg.text}</span>
              <small>{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Saved locally'}</small>
              <button type="button" aria-label={`Delete message turn from ${msg.role === 'assistant' ? companionName : 'You'}`} onClick={() => { chatGate.current.invalidate(); setIsSending(false); setMessages((current) => removeHistoryTurn(current, msg.id)) }}>Delete turn</button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" disabled={messages.length === 0} onClick={() => { if (!window.confirm('Delete all local conversation history for this browser identity? Cloud backups are not deleted.')) return; chatGate.current.invalidate(); setIsSending(false); setChatStatus(''); safeLocalStorageDelete(localAccountKey(STORAGE_KEYS.messages, session), localAccountKey('ai_friendship_cloud_conversation_id', session)); setMessages([]) }}>
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
      <p className="small">AI Aurora always remains clearly identified as AI even when you choose a companion name.</p>
      <h3>Data controls</h3>
      <p className="small">Deleting local data removes this {session ? 'account’s' : 'guest’s'} chat, project notes and memory from this browser. Any cloud backup must be deleted separately by deleting the account.</p>
      <div className="account-actions">
        <button type="button" onClick={() => downloadJson('ai-friendship-data.json', createExportBundle({
          messages, memory: memoryItems, projectNotes, companionName,
        }))}>Export my local data</button>
        <button type="button" onClick={clearLocalData}>Delete local chat, memory + project data</button>
      </div>
      <h3>Account status</h3>
      <p className="warn">{hasCloudAuth() ? 'Local data is kept separately for each signed-in account on this browser. Cloud backup is manual and still requires staging verification.' : 'Cloud accounts are not configured in this preview. Local browser storage is not a private account vault.'}</p>
    </section>
  )


  const renderAccount = () => (
    <section className="panel">
      <h2>Account</h2>
      {!adultAccess && <div className="age-notice"><strong>18+ only.</strong> Adult eligibility must be established before account creation or interactive companion access.</div>}
      {!hasCloudAuth() ? (
        <p className="warn">Cloud accounts are not configured on this deployment yet. Local preview features remain available.</p>
      ) : session ? (
        <>
          <p>Signed in as <strong>{session.user.email}</strong>.</p>
          <p className="small">Cloud-backed features must still pass two-account isolation testing before production use.</p>
          <div className="account-actions">
            <button type="button" disabled={authBusy || messages.length === 0} onClick={() => void runAccountAction(async () => {
              try {
                const backupKey = localAccountKey('ai_friendship_cloud_conversation_id', session)
                const backupId = safeLocalStorageGet(backupKey, '') || crypto.randomUUID()
                safeLocalStorageSet(backupKey, backupId)
                await backupConversation(session, 'AI Aurora conversation', chatMode, messages, backupId)
                setAuthStatus('Conversation backed up to your cloud account.')
              } catch { setAuthStatus('Cloud conversation backup failed. Your local data is unchanged.') }
            })}>Back up conversation</button>
            <button type="button" disabled={authBusy || memoryItems.length === 0} onClick={() => void runAccountAction(async () => {
              try {
                await backupMemoryItems(session, memoryItems)
                setAuthStatus('Approved memory backed up to your cloud account.')
              } catch { setAuthStatus('Cloud memory backup failed. Your local data is unchanged.') }
            })}>Back up approved memory</button>
            <button type="button" disabled={authBusy} onClick={() => void runAccountAction(async () => {
              await signOut(session)
              activateSession(null)
              setAuthStatus('Signed out.')
            })}>Sign out</button>
            <button className="danger" type="button" disabled={authBusy} onClick={() => void runAccountAction(async () => {
              const confirmed = window.confirm('Permanently delete this AI Aurora account and its cloud data?')
              if (!confirmed) return
              try {
                await deleteAccount(session)
                safeLocalStorageDelete(...accountDeletionKeys(session))
                activateSession(null)
                setAuthStatus('Account deleted.')
              } catch { setAuthStatus('Account deletion failed. Local data was not cleared.') }
            })}>Delete account permanently</button>
          </div>
          {authStatus && <p className="small" role="status">{authStatus}</p>}
        </>
      ) : (
        <>
          <label>Email<input type="email" autoComplete="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></label>
          <label>Password<input type="password" autoComplete="current-password" minLength={8} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></label>
          <div className="starters">
            <button type="button" disabled={authBusy} onClick={() => void runAccountAction(async () => {
              try { const next = await signIn(authEmail.trim(), authPassword); if (next) { saveSession(next); activateSession(next); setAuthStatus('Signed in.') } }
              catch (error) { setAuthStatus(error instanceof Error ? error.message : 'Sign in failed.') }
            })}>Sign in</button>
            <button type="button" disabled={authBusy || !adultAccess} onClick={() => void runAccountAction(async () => {
              try { const next = await signUp(authEmail.trim(), authPassword); if (next) { saveSession(next); activateSession(next); setAuthStatus('Account created and signed in.') } else setAuthStatus('Account created. Check your email if confirmation is required.') }
              catch (error) { setAuthStatus(error instanceof Error ? error.message : 'Registration failed.') }
            })}>Create account</button>
            <button type="button" disabled={authBusy} onClick={() => void runAccountAction(async () => {
              try { await requestPasswordReset(authEmail.trim()); setAuthStatus('If that account exists, recovery instructions have been requested.') }
              catch { setAuthStatus('Unable to request recovery right now.') }
            })}>Forgot password</button>
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
              aria-label={plan.id === 'free' ? 'Current free plan' : `${plan.name} unavailable until billing is ready`}
              aria-current={planId === plan.id}
              disabled={plan.id !== 'free'}
            >
              {planId === plan.id ? 'Current plan' : 'Coming later'}
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
      <div className="age-notice"><strong>Adult-only interactive service.</strong> AI Aurora is intended for users aged 18+. Age assurance should collect only the minimum information needed and payment-card possession is not treated as proof of age.</div>
      <ul>
        <li>Encryption in transit uses HTTPS/TLS when deployed.</li>
        <li>Secrets must stay in environment variables, never hard-coded.</li>
        <li>You can clear chat history and creative notes locally at any time.</li>
        <li>Data collection should stay minimal and purpose-limited.</li>
        <li>AI/database providers may process data per their terms and configuration.</li>
      </ul>
      <p>
        AI Aurora is not legally privileged communication, not a therapist, and not absolute confidentiality.
      </p>
      <p className="warn">
        Production launch still requires: security review, access controls, logging policy, retention policy, and
        provider data-processing/legal review.
      </p>
      <div className="account-actions">
        <button type="button" onClick={() => downloadJson('ai-friendship-data.json', createExportBundle({
          messages, memory: memoryItems, projectNotes, companionName,
        }))}>Export my local data</button>
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

  const renderAdultGate = () => (
    <section className="panel adult-gate-page" aria-labelledby="adult-gate-title">
      <p className="eyebrow">ADULT ACCESS</p>
      <h1 id="adult-gate-title">AI Aurora is an 18+ interactive experience.</h1>
      <p>You must be 18 or over to use Aurora's chat, memory, history, account, settings or immersive companion features.</p>
      <p className="small">Aurora is an adult AI persona with a 25+ presentation. Payment-card possession is not treated as proof of age.</p>
      <div className="hero-actions">
        <button type="button" onClick={() => setAdultAccess(true)}>I confirm I am 18 or over</button>
        <a className="secondary-cta" href="#/">Return home</a>
      </div>
      <p className="small">Preview control only. Production access will require the configured age-assurance mechanism to pass server-side verification.</p>
    </section>
  )

  let page = renderHome()
  if (routeRequiresAdultGate(route) && !adultAccess) {
    page = renderAdultGate()
  } else switch (route) {
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
        <a className="brand" href="#/" aria-label="AI Aurora home"><span className="brand-mark">A</span><span>AI <strong>AURORA</strong></span></a>
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
        AI Aurora is an AI companion for conversation and creativity. Not human. Not therapy. Not emergency support.
      </footer>
    </div>
  )
}

export default App
