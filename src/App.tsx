import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'
import {
  generateVisitSummary,
  getGuidance,
  type ConsultationInput,
  type CountrySetting,
  type GuidanceResponse,
  type PregnancyPossibility,
  type SexAtBirth,
  type Severity,
  type Urgency,
} from './utils/healthGuidance'
import { hashCredential } from './utils/localAuth'
import { disclosureText, emergencyNotice, isCrisisText } from './utils/safety'
import { safeLocalStorageDelete, safeLocalStorageGet, safeLocalStorageSet } from './utils/storage'

type Route =
  | '/'
  | '/how-it-works'
  | '/about'
  | '/safety'
  | '/privacy'
  | '/terms'
  | '/contact'
  | '/faq'
  | '/sign-in'
  | '/create-account'
  | '/forgot-password'
  | '/reset-password'
  | '/dashboard'
  | '/consultation'
  | '/settings'

type TextSize = 'standard' | 'large' | 'x-large'
type FeedbackChoice = 'yes' | 'somewhat' | 'no' | ''

type LocalAccount = {
  email: string
  firstName: string
  passwordHash: string
  country: CountrySetting
  createdAt: string
}

type AppSettings = {
  textSize: TextSize
  analyticsEnabled: boolean
  saveHistory: boolean
}

type ConsultationRecord = {
  id: string
  ownerEmail: string
  title: string
  createdAt: string
  updatedAt: string
  input: ConsultationInput
  response: GuidanceResponse
  visitSummary: string
  feedbackChoice: FeedbackChoice
  feedbackNotes: string
}

const ROUTES: Route[] = [
  '/',
  '/how-it-works',
  '/about',
  '/safety',
  '/privacy',
  '/terms',
  '/contact',
  '/faq',
  '/sign-in',
  '/create-account',
  '/forgot-password',
  '/reset-password',
  '/dashboard',
  '/consultation',
  '/settings',
]

const STORAGE_KEYS = {
  account: 'ai_doctor_account',
  consultations: 'ai_doctor_consultations',
  consent: 'ai_doctor_consent',
  draft: 'ai_doctor_draft_consultation',
  pendingResetEmail: 'ai_doctor_pending_reset_email',
  sessionEmail: 'ai_doctor_session_email',
  settings: 'ai_doctor_settings',
}

const routeMeta: Record<Route, { title: string; description: string }> = {
  '/': {
    title: 'AI Doctor | Understand your symptoms',
    description: 'AI-powered health information to help you understand symptoms, know when to seek care, and prepare for the right conversation with a healthcare professional.',
  },
  '/how-it-works': {
    title: 'How It Works | AI Doctor',
    description: 'See how AI Doctor guides structured symptom checks, safety triage, visit summaries, and next-step planning.',
  },
  '/about': {
    title: 'About AI Doctor',
    description: 'Learn what AI Doctor is, what it can help with, and the limits that keep it safety-focused.',
  },
  '/safety': {
    title: 'Safety | AI Doctor',
    description: 'Understand AI Doctor safety rules, emergency escalation, and how urgent symptoms are handled.',
  },
  '/privacy': {
    title: 'Privacy | AI Doctor',
    description: 'Read how AI Doctor handles privacy, local storage, data deletion, and product analytics boundaries.',
  },
  '/terms': {
    title: 'Terms | AI Doctor',
    description: 'Review the terms, limits, and responsible use expectations for AI Doctor.',
  },
  '/contact': {
    title: 'Contact | AI Doctor',
    description: 'Contact AI Doctor for product support, safety concerns, or privacy and data control requests.',
  },
  '/faq': {
    title: 'FAQ | AI Doctor',
    description: 'Answers to common questions about diagnosis, emergencies, privacy, children, pregnancy, and accuracy.',
  },
  '/sign-in': {
    title: 'Sign In | AI Doctor',
    description: 'Sign in to save consultations on this device and manage your AI Doctor privacy settings.',
  },
  '/create-account': {
    title: 'Create Account | AI Doctor',
    description: 'Create an AI Doctor account for private on-device consultation history and settings.',
  },
  '/forgot-password': {
    title: 'Forgot Password | AI Doctor',
    description: 'Start a local password reset for AI Doctor on this device.',
  },
  '/reset-password': {
    title: 'Reset Password | AI Doctor',
    description: 'Reset your local AI Doctor password on this device.',
  },
  '/dashboard': {
    title: 'Dashboard | AI Doctor',
    description: 'Review recent consultations, summaries, feedback, and privacy controls in AI Doctor.',
  },
  '/consultation': {
    title: 'Check My Symptoms | AI Doctor',
    description: 'Describe symptoms, answer relevant follow-up questions, and receive structured health information and next-step guidance.',
  },
  '/settings': {
    title: 'Settings | AI Doctor',
    description: 'Manage local privacy settings, data controls, accessibility, and your AI Doctor account details.',
  },
}

const urgencyLabels: Record<Urgency, string> = {
  emergency: 'Emergency care now',
  urgent: 'Urgent same-day advice',
  soon: 'Medical advice soon',
  routine: 'Monitor and arrange routine advice',
  'self-care': 'Self-care with safety netting',
}

const faqItems = [
  {
    question: 'What is AI Doctor?',
    answer:
      'AI Doctor is an AI-powered health information tool designed to help you organise symptoms, understand possible explanations, and prepare for the right conversation with a healthcare professional.',
  },
  {
    question: 'Can AI Doctor diagnose me?',
    answer:
      'No. AI Doctor cannot diagnose, examine, prescribe, or replace a clinician. It offers structured health information and safety-focused guidance only.',
  },
  {
    question: 'Is AI Doctor a replacement for my doctor?',
    answer:
      'No. Use AI Doctor to prepare for care, not to replace a GP, pharmacist, urgent care service, or emergency service.',
  },
  {
    question: 'What should I do in an emergency?',
    answer:
      'If symptoms are severe, rapidly worsening, or you think you may be in immediate danger, contact your local emergency service immediately. UK users may also use NHS 111 for urgent non-emergency advice.',
  },
  {
    question: 'How does AI Doctor use my information?',
    answer:
      'This standalone build stores account state, settings, and consultation history locally in your browser only when you choose to save them. Do not treat this build as a clinical record or secure cloud account.',
  },
  {
    question: 'Can I delete my information?',
    answer:
      'Yes. You can clear consultation history, delete your local account, or wipe all on-device data from Settings at any time.',
  },
  {
    question: 'Can I use AI Doctor without creating an account?',
    answer:
      'Yes. Guest consultations work without sign-in, but consultation history stays unsaved unless you sign in and enable on-device saving.',
  },
  {
    question: 'How accurate is AI Doctor?',
    answer:
      'AI Doctor can help organise information, but its guidance may be incomplete or wrong. Use it as a support tool and seek professional assessment when symptoms are persistent, severe, or concerning.',
  },
  {
    question: 'Should I follow AI Doctor’s advice?',
    answer:
      'Use the guidance cautiously and compare it with advice from qualified healthcare professionals. Escalate to real-world care whenever symptoms are severe, worsening, or you do not feel safe.',
  },
  {
    question: 'Can I use AI Doctor for children?',
    answer:
      'Children, older adults, pregnancy, and medically complex situations can need lower thresholds for professional review. Use AI Doctor carefully and seek clinician support early when you are unsure.',
  },
  {
    question: 'Can I use AI Doctor during pregnancy?',
    answer:
      'You can, but pregnancy-related pain, bleeding, fainting, severe vomiting, or reduced safety should prompt professional medical advice quickly.',
  },
  {
    question: 'What happens if AI Doctor is unsure?',
    answer:
      'AI Doctor highlights uncertainty, asks relevant follow-up questions, and leans toward recommending professional review instead of giving false certainty.',
  },
]

const parseRoute = (): Route => {
  const hash = window.location.hash.replace('#', '') || '/'
  return ROUTES.includes(hash as Route) ? (hash as Route) : '/'
}

const getBlankConsultation = (country: CountrySetting): ConsultationInput => ({
  concern: '',
  mainSymptom: '',
  started: '',
  severity: 'not-sure',
  location: '',
  feeling: '',
  betterWorse: '',
  otherSymptoms: '',
  medicalBackground: '',
  medicines: '',
  allergies: '',
  ageRange: '',
  sexAtBirth: '',
  pregnancyPossibility: '',
  country,
})

const todayLabel = (): string =>
  new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const getConsultationTitle = (input: ConsultationInput): string =>
  input.mainSymptom || input.concern.split(/[.?!]/)[0]?.slice(0, 60) || `Consultation ${todayLabel()}`

const App = () => {
  const [route, setRoute] = useState<Route>(parseRoute())
  const [hasAcceptedSafety, setHasAcceptedSafety] = useState<boolean>(() =>
    safeLocalStorageGet(STORAGE_KEYS.consent, false),
  )
  const [settings, setSettings] = useState<AppSettings>(() =>
    safeLocalStorageGet(STORAGE_KEYS.settings, {
      textSize: 'standard',
      analyticsEnabled: false,
      saveHistory: true,
    }),
  )
  const [account, setAccount] = useState<LocalAccount | null>(() => safeLocalStorageGet(STORAGE_KEYS.account, null))
  const [sessionEmail, setSessionEmail] = useState<string>(() => safeLocalStorageGet(STORAGE_KEYS.sessionEmail, ''))
  const [pendingResetEmail, setPendingResetEmail] = useState<string>(() =>
    safeLocalStorageGet(STORAGE_KEYS.pendingResetEmail, ''),
  )
  const [consultations, setConsultations] = useState<ConsultationRecord[]>(() =>
    safeLocalStorageGet(STORAGE_KEYS.consultations, []),
  )
  const [draft, setDraft] = useState<ConsultationInput>(() =>
    safeLocalStorageGet(STORAGE_KEYS.draft, getBlankConsultation(account?.country || 'uk')),
  )
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null)
  const [response, setResponse] = useState<GuidanceResponse | null>(null)
  const [visitSummary, setVisitSummary] = useState('')
  const [feedbackChoice, setFeedbackChoice] = useState<FeedbackChoice>('')
  const [feedbackNotes, setFeedbackNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [consultationError, setConsultationError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [authError, setAuthError] = useState('')
  const [authInfo, setAuthInfo] = useState('')
  const [signInState, setSignInState] = useState({ email: '', password: '' })
  const [createAccountState, setCreateAccountState] = useState({
    firstName: account?.firstName || '',
    email: account?.email || '',
    password: '',
    confirmPassword: '',
    country: account?.country || 'uk' as CountrySetting,
  })
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetPassword, setResetPassword] = useState({ password: '', confirmPassword: '' })

  const navigate = (nextRoute: Route) => {
    window.history.replaceState(null, '', `#${nextRoute}`)
    setRoute(nextRoute)
  }

  const isSignedIn = Boolean(account && sessionEmail && account.email === sessionEmail)
  const currentOwnerEmail = isSignedIn && account ? account.email : ''

  const visibleConsultations = useMemo(
    () => consultations.filter((item) => item.ownerEmail === currentOwnerEmail).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [consultations, currentOwnerEmail],
  )

  const consultationCounts = useMemo(
    () => ({
      total: visibleConsultations.length,
      urgent: visibleConsultations.filter((item) => item.response.urgency === 'urgent' || item.response.urgency === 'emergency').length,
      summaries: visibleConsultations.filter((item) => item.visitSummary.trim().length > 0).length,
    }),
    [visibleConsultations],
  )

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.consent, hasAcceptedSafety)
  }, [hasAcceptedSafety])

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.settings, settings)
  }, [settings])

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.account, account)
  }, [account])

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.sessionEmail, sessionEmail)
  }, [sessionEmail])

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.pendingResetEmail, pendingResetEmail)
  }, [pendingResetEmail])

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.consultations, consultations)
  }, [consultations])

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.draft, draft)
  }, [draft])

  useEffect(() => {
    const meta = routeMeta[route]
    document.title = meta.title
    const descriptionTag = document.querySelector('meta[name="description"]')
    if (descriptionTag) {
      descriptionTag.setAttribute('content', meta.description)
    }
  }, [route])

  const updateDraft = <K extends keyof ConsultationInput>(key: K, value: ConsultationInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const startNewConsultation = () => {
    const country = account?.country || draft.country || 'uk'
    setActiveConsultationId(null)
    setDraft(getBlankConsultation(country))
    setResponse(null)
    setVisitSummary('')
    setFeedbackChoice('')
    setFeedbackNotes('')
    setConsultationError('')
    setCopyMessage('')
    navigate('/consultation')
  }

  const loadConsultation = (item: ConsultationRecord) => {
    setDraft(item.input)
    setResponse(item.response)
    setVisitSummary(item.visitSummary)
    setFeedbackChoice(item.feedbackChoice)
    setFeedbackNotes(item.feedbackNotes)
    setActiveConsultationId(item.id)
    setConsultationError('')
    navigate('/consultation')
  }

  const clearCurrentConsultation = () => {
    setResponse(null)
    setVisitSummary('')
    setFeedbackChoice('')
    setFeedbackNotes('')
    setConsultationError('')
    setCopyMessage('')
    setActiveConsultationId(null)
    setDraft(getBlankConsultation(account?.country || draft.country || 'uk'))
  }

  const deleteConsultation = (id: string) => {
    setConsultations((current) => current.filter((item) => item.id !== id))
    if (activeConsultationId === id) {
      clearCurrentConsultation()
    }
  }

  const copyText = async (value: string, success: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(success)
    } catch {
      setCopyMessage('Copy is not available in this browser.')
    }
  }

  const upsertConsultation = (nextResponse: GuidanceResponse, nextSummary: string) => {
    if (!isSignedIn || !settings.saveHistory || !account) return

    const now = new Date().toISOString()
    const nextRecord: ConsultationRecord = {
      id: activeConsultationId || crypto.randomUUID(),
      ownerEmail: account.email,
      title: getConsultationTitle(draft),
      createdAt:
        visibleConsultations.find((item) => item.id === activeConsultationId)?.createdAt || now,
      updatedAt: now,
      input: draft,
      response: nextResponse,
      visitSummary: nextSummary,
      feedbackChoice,
      feedbackNotes,
    }

    setActiveConsultationId(nextRecord.id)
    setConsultations((current) => {
      const existing = current.some((item) => item.id === nextRecord.id)
      return existing ? current.map((item) => (item.id === nextRecord.id ? nextRecord : item)) : [nextRecord, ...current]
    })
  }

  const submitConsultation = async (event?: FormEvent) => {
    event?.preventDefault()
    setConsultationError('')
    setCopyMessage('')

    if (!draft.concern.trim() && !draft.mainSymptom.trim()) {
      setConsultationError('Please describe what is worrying you today before continuing.')
      return
    }

    if (!hasAcceptedSafety) {
      setConsultationError('Please confirm that you understand AI Doctor provides health information, not diagnosis or emergency care.')
      return
    }

    setLoading(true)

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 650))
      const nextResponse = getGuidance(draft)
      const nextSummary = generateVisitSummary(draft, nextResponse)
      setResponse(nextResponse)
      setVisitSummary(nextSummary)
      upsertConsultation(nextResponse, nextSummary)
    } catch {
      setConsultationError('AI Doctor could not generate guidance just now. Please review your answers and try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitFeedback = () => {
    if (!activeConsultationId) return
    setConsultations((current) =>
      current.map((item) =>
        item.id === activeConsultationId
          ? {
              ...item,
              feedbackChoice,
              feedbackNotes,
            }
          : item,
      ),
    )
    setCopyMessage('Feedback saved on this device.')
  }

  const signOut = () => {
    setSessionEmail('')
    setAuthInfo('Signed out.')
    navigate('/')
  }

  const handleCreateAccount = async (event: FormEvent) => {
    event.preventDefault()
    setAuthError('')
    setAuthInfo('')

    if (!createAccountState.firstName.trim() || !createAccountState.email.trim() || !createAccountState.password) {
      setAuthError('Please complete your name, email, and password.')
      return
    }

    if (createAccountState.password !== createAccountState.confirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }

    if (createAccountState.password.length < 10) {
      setAuthError('Choose a password with at least 10 characters.')
      return
    }

    const email = createAccountState.email.trim().toLowerCase()
    const passwordHash = await hashCredential(email, createAccountState.password)
    const nextAccount: LocalAccount = {
      email,
      firstName: createAccountState.firstName.trim(),
      passwordHash,
      country: createAccountState.country,
      createdAt: new Date().toISOString(),
    }

    setAccount(nextAccount)
    setSessionEmail(email)
    setDraft((current) => ({ ...current, country: nextAccount.country }))
    setCreateAccountState((current) => ({ ...current, password: '', confirmPassword: '' }))
    setAuthInfo('Account created on this device.')
    navigate('/dashboard')
  }

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault()
    setAuthError('')
    setAuthInfo('')

    const email = signInState.email.trim().toLowerCase()
    if (!account || account.email !== email) {
      setAuthError('No local account was found for that email on this device.')
      return
    }

    const passwordHash = await hashCredential(email, signInState.password)
    if (passwordHash !== account.passwordHash) {
      setAuthError('Email or password did not match this device account.')
      return
    }

    setSessionEmail(email)
    setSignInState({ email: '', password: '' })
    setAuthInfo('Signed in successfully.')
    navigate('/dashboard')
  }

  const handleForgotPassword = (event: FormEvent) => {
    event.preventDefault()
    setAuthError('')
    setAuthInfo('')

    const email = forgotEmail.trim().toLowerCase()
    if (!account || account.email !== email) {
      setAuthError('No local account was found for that email on this device.')
      return
    }

    setPendingResetEmail(email)
    setForgotEmail('')
    setAuthInfo('Reset ready. Choose a new password on the next step.')
    navigate('/reset-password')
  }

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault()
    setAuthError('')
    setAuthInfo('')

    if (!account || !pendingResetEmail || account.email !== pendingResetEmail) {
      setAuthError('There is no pending reset request on this device.')
      return
    }

    if (resetPassword.password.length < 10) {
      setAuthError('Choose a password with at least 10 characters.')
      return
    }

    if (resetPassword.password !== resetPassword.confirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }

    const passwordHash = await hashCredential(account.email, resetPassword.password)
    setAccount({ ...account, passwordHash })
    setPendingResetEmail('')
    setResetPassword({ password: '', confirmPassword: '' })
    setAuthInfo('Password reset complete. Sign in with your new password.')
    navigate('/sign-in')
  }

  const deleteAccountAndData = () => {
    setAccount(null)
    setSessionEmail('')
    setPendingResetEmail('')
    setConsultations([])
    clearCurrentConsultation()
    safeLocalStorageDelete(
      STORAGE_KEYS.account,
      STORAGE_KEYS.consultations,
      STORAGE_KEYS.pendingResetEmail,
      STORAGE_KEYS.sessionEmail,
      STORAGE_KEYS.draft,
    )
    setAuthInfo('Local account and saved consultation data deleted from this device.')
    navigate('/')
  }

  const clearAllLocalData = () => {
    setConsultations([])
    setResponse(null)
    setVisitSummary('')
    setFeedbackChoice('')
    setFeedbackNotes('')
    safeLocalStorageDelete(STORAGE_KEYS.consultations, STORAGE_KEYS.draft)
    setDraft(getBlankConsultation(account?.country || 'uk'))
    setCopyMessage('Local consultation data cleared from this device.')
  }

  const launchStarter = (concern: string, mainSymptom: string) => {
    setDraft((current) => ({
      ...current,
      concern,
      mainSymptom,
    }))
    navigate('/consultation')
  }

  const publicLinks: Array<{ href: Route; label: string }> = [
    { href: '/', label: 'Home' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/about', label: 'About AI Doctor' },
    { href: '/safety', label: 'Safety' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ]

  const renderHome = () => (
    <>
      <section className="hero panel">
        <div className="hero-copy">
          <span className="eyebrow">Safety-first symptom support</span>
          <h1>AI Doctor</h1>
          <p className="tagline">Understand your symptoms. Know what to do next.</p>
          <p>
            AI Doctor provides AI-powered health information to help you organise symptoms, understand possible
            explanations, and prepare for appropriate care. It does not replace a doctor, nurse, pharmacist,
            emergency service, or other qualified healthcare professional.
          </p>
          <div className="action-row">
            <button type="button" className="primary" onClick={() => navigate('/consultation')}>
              Check My Symptoms
            </button>
            <button type="button" onClick={() => navigate('/how-it-works')}>
              How It Works
            </button>
          </div>
          <p className="notice soft">{emergencyNotice}</p>
        </div>
        <aside className="hero-card" aria-label="Why AI Doctor helps">
          <h2>What AI Doctor helps with</h2>
          <ul>
            <li>Describe symptoms and what changed.</li>
            <li>Receive structured health information, not diagnosis.</li>
            <li>See when pharmacist, GP, urgent care, or emergency help may be appropriate.</li>
            <li>Create a concise healthcare visit summary to copy or share.</li>
          </ul>
        </aside>
      </section>

      <section className="panel section-stack">
        <div className="section-heading">
          <h2>Start with a guided prompt</h2>
          <p>Pick a starting point or write your own concern in free text.</p>
        </div>
        <div className="card-grid">
          {[
            ['I have chest discomfort and I am not sure how worried to be.', 'Chest discomfort'],
            ['I have had stomach pain and nausea since yesterday.', 'Stomach pain'],
            ['I have a headache and feel dizzy today.', 'Headache'],
            ['I have a rash that seems to be spreading.', 'Rash'],
          ].map(([concern, mainSymptom]) => (
            <button
              key={mainSymptom}
              type="button"
              className="card-button"
              onClick={() => launchStarter(concern, mainSymptom)}
            >
              <strong>{mainSymptom}</strong>
              <span>{concern}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel section-stack">
        <div className="section-heading">
          <h2>Built around safe next steps</h2>
        </div>
        <div className="card-grid three-up">
          <article className="info-card">
            <h3>Health information</h3>
            <p>Clear summaries of what you entered and what might matter clinically.</p>
          </article>
          <article className="info-card">
            <h3>Urgency guidance</h3>
            <p>Safety netting for emergencies, urgent care, pharmacist support, and routine follow-up.</p>
          </article>
          <article className="info-card">
            <h3>Visit preparation</h3>
            <p>Copy a concise healthcare visit summary and useful questions for a clinician.</p>
          </article>
        </div>
      </section>
    </>
  )

  const renderHowItWorks = () => (
    <section className="panel section-stack">
      <div className="section-heading">
        <h1>How AI Doctor works</h1>
        <p>Structured symptom support with safety checks, follow-up questions, and clinician-ready summaries.</p>
      </div>
      <ol className="steps-list">
        <li>
          <strong>Describe what is worrying you.</strong>
          <span>Use free text, then add only the details that matter for that symptom.</span>
        </li>
        <li>
          <strong>AI Doctor asks for missing context.</strong>
          <span>Severity, timing, location, and associated symptoms help shape safer guidance.</span>
        </li>
        <li>
          <strong>Review possible explanations and next steps.</strong>
          <span>You get structured information, warning signs, and the right level of care to consider.</span>
        </li>
        <li>
          <strong>Take a healthcare visit summary with you.</strong>
          <span>Copy a concise note with symptoms, duration, severity, and questions to ask a professional.</span>
        </li>
      </ol>
    </section>
  )

  const renderAbout = () => (
    <section className="panel section-stack">
      <div className="section-heading">
        <h1>About AI Doctor</h1>
        <p>
          AI Doctor is designed to help people understand symptoms, spot warning signs, and prepare for the right
          level of care. It is not a clinic, not a diagnostic device, and not a substitute for qualified medical care.
        </p>
      </div>
      <div className="card-grid three-up">
        <article className="info-card">
          <h2>What it can do</h2>
          <ul>
            <li>Organise what you are feeling.</li>
            <li>Explain possible causes in plain language.</li>
            <li>Highlight red flags that need prompt care.</li>
          </ul>
        </article>
        <article className="info-card">
          <h2>What it cannot do</h2>
          <ul>
            <li>Diagnose you with certainty.</li>
            <li>Examine you, order tests, or read medical records.</li>
            <li>Prescribe medicines or replace emergency services.</li>
          </ul>
        </article>
        <article className="info-card">
          <h2>Who should use caution</h2>
          <ul>
            <li>Children, pregnancy, older adults, and medically complex situations.</li>
            <li>Rapidly worsening symptoms or anything that feels unsafe.</li>
            <li>Situations where immediate real-world help may be needed.</li>
          </ul>
        </article>
      </div>
    </section>
  )

  const renderSafety = () => (
    <section className="panel section-stack">
      <div className="section-heading">
        <h1>Safety</h1>
        <p>{disclosureText}</p>
      </div>
      <div className="alert emergency-card">
        <strong>Could this be an emergency?</strong>
        <p>
          If you have severe or rapidly worsening symptoms, or believe you are in immediate danger, contact your
          local emergency service now.
        </p>
      </div>
      <div className="card-grid two-up">
        <article className="info-card">
          <h2>AI Doctor prioritises escalation</h2>
          <ul>
            <li>Severe difficulty breathing</li>
            <li>Severe chest pain</li>
            <li>Signs of stroke</li>
            <li>Severe allergic reaction</li>
            <li>Seizures, loss of consciousness, or uncontrolled bleeding</li>
            <li>Suicidal crisis or immediate danger</li>
          </ul>
        </article>
        <article className="info-card">
          <h2>Safety rules</h2>
          <ul>
            <li>Never claims certainty where uncertainty exists.</li>
            <li>Never pretends to examine, diagnose, or access records.</li>
            <li>Never advises stopping prescribed medicines without professional review.</li>
            <li>Never minimises serious symptoms for convenience.</li>
            <li>Asks for relevant follow-up information before making assumptions.</li>
          </ul>
        </article>
      </div>
    </section>
  )

  const renderPrivacy = () => (
    <section className="panel section-stack">
      <div className="section-heading">
        <h1>Privacy</h1>
        <p>
          Health-related information is sensitive. This standalone build stores data locally in your browser when you
          choose to save it and does not expose symptom text in URLs or analytics metadata.
        </p>
      </div>
      <div className="card-grid two-up">
        <article className="info-card">
          <h2>What is stored</h2>
          <ul>
            <li>Optional local account details on this device.</li>
            <li>Consultation history and generated summaries only if you sign in and keep history enabled.</li>
            <li>Accessibility and privacy settings on this device.</li>
          </ul>
        </article>
        <article className="info-card">
          <h2>What is not stored</h2>
          <ul>
            <li>No symptom text is placed in the URL.</li>
            <li>No raw symptom text is sent into analytics events.</li>
            <li>No public page exposes saved health information.</li>
          </ul>
        </article>
      </div>
      <p className="notice soft">
        Controlled public launch still requires production authentication, server-side access controls, retention
        policies, provider review, and legal or compliance review for the intended deployment.
      </p>
    </section>
  )

  const renderTerms = () => (
    <section className="panel section-stack">
      <div className="section-heading">
        <h1>Terms</h1>
      </div>
      <ul className="bullets">
        <li>AI Doctor provides health information and educational guidance only.</li>
        <li>It does not create a clinician-patient relationship.</li>
        <li>You remain responsible for seeking professional medical help when symptoms are severe, persistent, or worrying.</li>
        <li>Do not rely on AI Doctor for emergencies.</li>
        <li>Do not assume AI Doctor has seen your records, examined you, or consulted a clinician unless a real integration explicitly says so.</li>
      </ul>
    </section>
  )

  const renderContact = () => (
    <section className="panel section-stack">
      <div className="section-heading">
        <h1>Contact</h1>
        <p>Use the routes below for product questions, privacy requests, or help using the service safely.</p>
      </div>
      <div className="card-grid three-up">
        <article className="info-card">
          <h2>Product support</h2>
          <p>Review the FAQ first, then use the on-device feedback form after a consultation.</p>
        </article>
        <article className="info-card">
          <h2>Privacy and data</h2>
          <p>Use Settings to delete local account data or clear consultation history stored on this device.</p>
        </article>
        <article className="info-card">
          <h2>Safety concern</h2>
          <p>If you are worried about medical symptoms, contact a real clinician or emergency service instead of waiting for an online reply.</p>
        </article>
      </div>
    </section>
  )

  const renderFaq = () => (
    <section className="panel section-stack">
      <div className="section-heading">
        <h1>FAQ</h1>
      </div>
      <div className="faq-list">
        {faqItems.map((item) => (
          <article key={item.question} className="faq-item">
            <h2>{item.question}</h2>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  )

  const renderSignIn = () => (
    <section className="panel auth-panel">
      <div className="section-heading">
        <h1>Sign in</h1>
        <p>Private on-device sign in lets you save consultation history locally in this browser.</p>
      </div>
      <form className="form-stack" onSubmit={handleSignIn}>
        <label>
          Email
          <input
            type="email"
            value={signInState.email}
            onChange={(event) => setSignInState((current) => ({ ...current, email: event.target.value }))}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={signInState.password}
            onChange={(event) => setSignInState((current) => ({ ...current, password: event.target.value }))}
            autoComplete="current-password"
          />
        </label>
        <div className="action-row">
          <button type="submit" className="primary">
            Sign in
          </button>
          <button type="button" onClick={() => navigate('/forgot-password')}>
            Forgot password
          </button>
        </div>
      </form>
    </section>
  )

  const renderCreateAccount = () => (
    <section className="panel auth-panel">
      <div className="section-heading">
        <h1>Create account</h1>
        <p>Create a local AI Doctor account on this device to save summaries, consultations, and settings privately in your browser.</p>
      </div>
      <form className="form-stack" onSubmit={handleCreateAccount}>
        <div className="field-grid two-up">
          <label>
            First name
            <input
              value={createAccountState.firstName}
              onChange={(event) => setCreateAccountState((current) => ({ ...current, firstName: event.target.value }))}
              autoComplete="given-name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={createAccountState.email}
              onChange={(event) => setCreateAccountState((current) => ({ ...current, email: event.target.value }))}
              autoComplete="email"
            />
          </label>
        </div>
        <div className="field-grid two-up">
          <label>
            Password
            <input
              type="password"
              value={createAccountState.password}
              onChange={(event) => setCreateAccountState((current) => ({ ...current, password: event.target.value }))}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={createAccountState.confirmPassword}
              onChange={(event) => setCreateAccountState((current) => ({ ...current, confirmPassword: event.target.value }))}
              autoComplete="new-password"
            />
          </label>
        </div>
        <label>
          Country setting
          <select
            value={createAccountState.country}
            onChange={(event) => setCreateAccountState((current) => ({ ...current, country: event.target.value as CountrySetting }))}
          >
            <option value="uk">United Kingdom</option>
            <option value="other">Other / prefer generic guidance</option>
          </select>
        </label>
        <p className="small">Only information genuinely needed for this local build is requested. You can update or delete it later.</p>
        <button type="submit" className="primary">
          Create account
        </button>
      </form>
    </section>
  )

  const renderForgotPassword = () => (
    <section className="panel auth-panel">
      <div className="section-heading">
        <h1>Forgot password</h1>
        <p>Reset is available only for the local AI Doctor account stored on this device.</p>
      </div>
      <form className="form-stack" onSubmit={handleForgotPassword}>
        <label>
          Email
          <input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} autoComplete="email" />
        </label>
        <button type="submit" className="primary">
          Continue to reset
        </button>
      </form>
    </section>
  )

  const renderResetPassword = () => (
    <section className="panel auth-panel">
      <div className="section-heading">
        <h1>Reset password</h1>
        <p>{pendingResetEmail ? `Resetting password for ${pendingResetEmail}.` : 'Start from Forgot Password first.'}</p>
      </div>
      <form className="form-stack" onSubmit={handleResetPassword}>
        <label>
          New password
          <input
            type="password"
            value={resetPassword.password}
            onChange={(event) => setResetPassword((current) => ({ ...current, password: event.target.value }))}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={resetPassword.confirmPassword}
            onChange={(event) => setResetPassword((current) => ({ ...current, confirmPassword: event.target.value }))}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className="primary" disabled={!pendingResetEmail}>
          Reset password
        </button>
      </form>
    </section>
  )

  const renderDashboard = () => (
    <section className="section-stack">
      <div className="panel hero compact">
        <div className="hero-copy">
          <span className="eyebrow">Your dashboard</span>
          <h1>{isSignedIn && account ? `Welcome back, ${account.firstName}` : 'Dashboard'}</h1>
          <p>
            Start a new consultation, continue a saved one, review visit summaries, and manage privacy settings.
          </p>
          <div className="action-row">
            <button type="button" className="primary" onClick={startNewConsultation}>
              Start new consultation
            </button>
            <button type="button" onClick={() => navigate('/settings')}>
              Privacy settings
            </button>
          </div>
        </div>
        <div className="stats-grid">
          <article className="stat-card">
            <strong>{consultationCounts.total}</strong>
            <span>Saved consultations</span>
          </article>
          <article className="stat-card">
            <strong>{consultationCounts.summaries}</strong>
            <span>Saved summaries</span>
          </article>
          <article className="stat-card">
            <strong>{consultationCounts.urgent}</strong>
            <span>Urgent / emergency flags</span>
          </article>
        </div>
      </div>

      {!isSignedIn && (
        <div className="panel notice-card">
          <strong>Guest mode</strong>
          <p>Consultations work without sign-in, but history is not saved unless you create or sign in to a local account on this device.</p>
          <div className="action-row">
            <button type="button" className="primary" onClick={() => navigate('/create-account')}>
              Create account
            </button>
            <button type="button" onClick={() => navigate('/sign-in')}>
              Sign in
            </button>
          </div>
        </div>
      )}

      <section className="panel section-stack">
        <div className="section-heading inline-between">
          <div>
            <h2>Recent consultations</h2>
            <p>Continue, copy, or delete a saved consultation.</p>
          </div>
          <button type="button" onClick={clearAllLocalData}>
            Clear consultation history
          </button>
        </div>
        {visibleConsultations.length === 0 ? (
          <p className="small">No saved consultations yet.</p>
        ) : (
          <div className="history-list">
            {visibleConsultations.map((item) => (
              <article key={item.id} className="history-card">
                <div>
                  <h3>{item.title}</h3>
                  <p className="small">Updated {new Date(item.updatedAt).toLocaleString('en-GB')} • {urgencyLabels[item.response.urgency]}</p>
                  <p>{item.input.concern || item.input.mainSymptom}</p>
                </div>
                <div className="history-actions">
                  <button type="button" onClick={() => loadConsultation(item)}>
                    Continue consultation
                  </button>
                  <button type="button" onClick={() => copyText(item.visitSummary, 'Summary copied.') }>
                    Copy summary
                  </button>
                  <button type="button" onClick={() => deleteConsultation(item.id)}>
                    Delete consultation
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )

  const renderConsultation = () => {
    const progressiveDetailsVisible = Boolean(draft.concern.trim() || draft.mainSymptom.trim())
    const medicalDetailsVisible =
      progressiveDetailsVisible &&
      Boolean(draft.started || draft.severity !== 'not-sure' || draft.otherSymptoms || draft.location || draft.feeling)

    return (
      <section className="section-stack">
        <div className="panel hero compact">
          <div className="hero-copy">
            <span className="eyebrow">AI Doctor consultation</span>
            <h1>What is worrying you today?</h1>
            <p>
              Describe symptoms in your own words and add only the details that matter. AI Doctor will summarise what you told it, explain what it could mean, and suggest sensible next steps.
            </p>
          </div>
          <div className="hero-card">
            <h2>Important</h2>
            <p>{disclosureText}</p>
            <p className="notice soft">{emergencyNotice}</p>
          </div>
        </div>

        {!isSignedIn && (
          <div className="panel notice-card">
            <strong>Using guest mode</strong>
            <p>Guidance works now, but consultations are not saved unless you sign in to a local account on this device.</p>
            <div className="action-row">
              <button type="button" onClick={() => navigate('/create-account')}>
                Create account
              </button>
              <button type="button" onClick={() => navigate('/sign-in')}>
                Sign in
              </button>
            </div>
          </div>
        )}

        <form className="panel form-stack consultation-form" onSubmit={submitConsultation}>
          <div className="section-heading inline-between">
            <div>
              <h2>Symptom details</h2>
              <p>Tell AI Doctor what is happening. Skip optional fields if they are not relevant.</p>
            </div>
            <div className="action-row compact-actions">
              <button type="button" onClick={startNewConsultation}>
                New consultation
              </button>
              <button type="button" onClick={clearCurrentConsultation}>
                Clear current
              </button>
            </div>
          </div>

          <label>
            What is worrying you today?
            <textarea
              value={draft.concern}
              onChange={(event) => updateDraft('concern', event.target.value)}
              placeholder="Describe what you are feeling, what changed, and why you are concerned."
            />
          </label>

          <div className="field-grid two-up">
            <label>
              Main symptom
              <input
                value={draft.mainSymptom}
                onChange={(event) => updateDraft('mainSymptom', event.target.value)}
                placeholder="Example: chest tightness, rash, stomach pain"
              />
            </label>
            <label>
              Country setting
              <select value={draft.country} onChange={(event) => updateDraft('country', event.target.value as CountrySetting)}>
                <option value="uk">United Kingdom</option>
                <option value="other">Other / generic guidance</option>
              </select>
            </label>
          </div>

          {progressiveDetailsVisible && (
            <div className="field-grid three-up">
              <label>
                When it started
                <input
                  value={draft.started}
                  onChange={(event) => updateDraft('started', event.target.value)}
                  placeholder="Example: 2 hours ago, yesterday evening"
                />
              </label>
              <label>
                Severity
                <select value={draft.severity} onChange={(event) => updateDraft('severity', event.target.value as Severity)}>
                  <option value="not-sure">Not sure</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </label>
              <label>
                Location
                <input
                  value={draft.location}
                  onChange={(event) => updateDraft('location', event.target.value)}
                  placeholder="Example: left chest, lower abdomen, behind eyes"
                />
              </label>
            </div>
          )}

          {medicalDetailsVisible && (
            <>
              <div className="field-grid two-up">
                <label>
                  How it feels
                  <input
                    value={draft.feeling}
                    onChange={(event) => updateDraft('feeling', event.target.value)}
                    placeholder="Example: sharp, cramping, burning, pressure"
                  />
                </label>
                <label>
                  Better or worse with anything?
                  <input
                    value={draft.betterWorse}
                    onChange={(event) => updateDraft('betterWorse', event.target.value)}
                    placeholder="Example: worse walking, better sitting upright"
                  />
                </label>
              </div>
              <label>
                Other symptoms
                <textarea
                  value={draft.otherSymptoms}
                  onChange={(event) => updateDraft('otherSymptoms', event.target.value)}
                  placeholder="Example: fever, cough, nausea, tingling, swelling"
                />
              </label>
              <div className="field-grid two-up">
                <label>
                  Relevant medical background
                  <textarea
                    value={draft.medicalBackground}
                    onChange={(event) => updateDraft('medicalBackground', event.target.value)}
                    placeholder="Optional: conditions, previous episodes, pregnancy, recent illness"
                  />
                </label>
                <div className="stacked-fields">
                  <label>
                    Current medicines
                    <textarea
                      value={draft.medicines}
                      onChange={(event) => updateDraft('medicines', event.target.value)}
                      placeholder="Optional"
                    />
                  </label>
                  <label>
                    Allergies
                    <input
                      value={draft.allergies}
                      onChange={(event) => updateDraft('allergies', event.target.value)}
                      placeholder="Optional"
                    />
                  </label>
                </div>
              </div>
              <div className="field-grid three-up">
                <label>
                  Age range
                  <select value={draft.ageRange} onChange={(event) => updateDraft('ageRange', event.target.value)}>
                    <option value="">Prefer not to say</option>
                    <option value="under-18">Under 18</option>
                    <option value="18-29">18–29</option>
                    <option value="30-49">30–49</option>
                    <option value="50-64">50–64</option>
                    <option value="65-plus">65+</option>
                  </select>
                </label>
                <label>
                  Sex where clinically relevant
                  <select value={draft.sexAtBirth} onChange={(event) => updateDraft('sexAtBirth', event.target.value as SexAtBirth)}>
                    <option value="">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="intersex">Intersex</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </label>
                <label>
                  Pregnancy possibility
                  <select
                    value={draft.pregnancyPossibility}
                    onChange={(event) => updateDraft('pregnancyPossibility', event.target.value as PregnancyPossibility)}
                  >
                    <option value="">Only if relevant</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="not-sure">Not sure</option>
                    <option value="not-applicable">Not applicable</option>
                  </select>
                </label>
              </div>
            </>
          )}

          <label className="checkbox-row">
            <input type="checkbox" checked={hasAcceptedSafety} onChange={(event) => setHasAcceptedSafety(event.target.checked)} />
            <span>I understand AI Doctor provides health information only and cannot diagnose or replace professional medical care.</span>
          </label>

          <div className="action-row">
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Reviewing symptoms…' : 'Generate guidance'}
            </button>
            <button type="button" onClick={() => submitConsultation()} disabled={loading || (!response && !draft.concern && !draft.mainSymptom)}>
              Retry
            </button>
          </div>

          {consultationError && <p className="error-text">{consultationError}</p>}
          {copyMessage && <p className="good">{copyMessage}</p>}
          {!settings.saveHistory && <p className="small">History saving is currently switched off in Settings.</p>}
          {!isSignedIn && <p className="small">Guest mode keeps responses on screen only until you leave or clear them.</p>}
        </form>

        {response && (
          <section className="panel section-stack">
            <div className={`alert ${response.emergency ? 'emergency-card' : response.urgency === 'urgent' ? 'warning-card' : 'soft-card'}`}>
              <strong>{response.headline}</strong>
              <p>{response.escalationMessage || urgencyLabels[response.urgency]}</p>
            </div>

            {isCrisisText(`${draft.concern} ${draft.otherSymptoms}`) && (
              <div className="alert emergency-card">
                <strong>Immediate help may be needed</strong>
                <p>{response.escalationMessage || emergencyNotice}</p>
              </div>
            )}

            <div className="section-heading inline-between">
              <div>
                <h2>AI Doctor response</h2>
                <p>{response.safetyDisclaimer}</p>
              </div>
              <div className="action-row compact-actions">
                <button type="button" onClick={() => copyText(response.summary.join('\n'), 'Summary copied.') }>
                  Copy response
                </button>
                <button type="button" onClick={() => copyText(visitSummary, 'Healthcare visit summary copied.') }>
                  Copy visit summary
                </button>
              </div>
            </div>

            <div className="response-grid">
              <article className="response-card">
                <h3>What you told me</h3>
                <ul>
                  {response.summary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="response-card">
                <h3>What it could mean</h3>
                <ul>
                  {response.possibleExplanations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="response-card">
                <h3>What you can do now</h3>
                <ul>
                  {response.selfCare.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="response-card">
                <h3>When to seek medical help</h3>
                <ul>
                  {response.seekHelp.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="response-card">
                <h3>Questions to ask a healthcare professional</h3>
                <ul>
                  {response.questions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="response-card">
                <h3>Important</h3>
                <ul>
                  {response.warningSigns.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  <li>{response.safetyDisclaimer}</li>
                </ul>
              </article>
            </div>

            {response.followUpQuestions.length > 0 && (
              <article className="panel inset-panel">
                <h3>Helpful follow-up questions</h3>
                <ul>
                  {response.followUpQuestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            )}

            <article className="panel inset-panel">
              <div className="section-heading inline-between">
                <div>
                  <h3>Healthcare Visit Summary</h3>
                  <p>Generated from what you entered. This is not a medical record unless formally integrated and supported.</p>
                </div>
              </div>
              <textarea value={visitSummary} readOnly />
            </article>

            <article className="panel inset-panel">
              <h3>Was this helpful?</h3>
              <div className="feedback-row" role="group" aria-label="Consultation feedback">
                {[
                  ['yes', 'Yes'],
                  ['somewhat', 'Somewhat'],
                  ['no', 'No'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={feedbackChoice === value ? 'selected' : ''}
                    onClick={() => setFeedbackChoice(value as FeedbackChoice)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label>
                Optional written feedback
                <textarea value={feedbackNotes} onChange={(event) => setFeedbackNotes(event.target.value)} placeholder="Tell us what was useful or what felt unclear." />
              </label>
              <button type="button" onClick={submitFeedback} disabled={!activeConsultationId}>
                Save feedback
              </button>
            </article>
          </section>
        )}
      </section>
    )
  }

  const renderSettings = () => (
    <section className="panel section-stack">
      <div className="section-heading inline-between">
        <div>
          <h1>Settings</h1>
          <p>Manage privacy controls, on-device storage, accessibility, and your local account.</p>
        </div>
        {isSignedIn && <button type="button" onClick={signOut}>Sign out</button>}
      </div>

      <div className="card-grid two-up">
        <article className="info-card">
          <h2>Privacy controls</h2>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.saveHistory}
              onChange={(event) => setSettings((current) => ({ ...current, saveHistory: event.target.checked }))}
            />
            <span>Save consultation history on this device after sign-in</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.analyticsEnabled}
              onChange={(event) => setSettings((current) => ({ ...current, analyticsEnabled: event.target.checked }))}
            />
            <span>Allow privacy-conscious product analytics without sending raw symptom text</span>
          </label>
        </article>
        <article className="info-card">
          <h2>Accessible text size</h2>
          <div className="feedback-row" role="group" aria-label="Text size setting">
            {[
              ['standard', 'Standard'],
              ['large', 'Large'],
              ['x-large', 'Extra large'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={settings.textSize === value ? 'selected' : ''}
                onClick={() => setSettings((current) => ({ ...current, textSize: value as TextSize }))}
              >
                {label}
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="card-grid two-up">
        <article className="info-card">
          <h2>Data controls</h2>
          <p>Delete saved consultations, local drafts, and browser-only account data from this device.</p>
          <div className="action-row">
            <button type="button" onClick={clearAllLocalData}>Clear consultation data</button>
            <button type="button" onClick={deleteAccountAndData}>Delete account and data</button>
          </div>
        </article>
        <article className="info-card">
          <h2>Local account</h2>
          {account ? (
            <>
              <p><strong>{account.firstName}</strong> • {account.email}</p>
              <p className="small">Created {new Date(account.createdAt).toLocaleString('en-GB')}</p>
            </>
          ) : (
            <p className="small">No local account yet. Create one to save consultations on this device.</p>
          )}
        </article>
      </div>
    </section>
  )

  let page = renderHome()

  switch (route) {
    case '/how-it-works':
      page = renderHowItWorks()
      break
    case '/about':
      page = renderAbout()
      break
    case '/safety':
      page = renderSafety()
      break
    case '/privacy':
      page = renderPrivacy()
      break
    case '/terms':
      page = renderTerms()
      break
    case '/contact':
      page = renderContact()
      break
    case '/faq':
      page = renderFaq()
      break
    case '/sign-in':
      page = renderSignIn()
      break
    case '/create-account':
      page = renderCreateAccount()
      break
    case '/forgot-password':
      page = renderForgotPassword()
      break
    case '/reset-password':
      page = renderResetPassword()
      break
    case '/dashboard':
      page = renderDashboard()
      break
    case '/consultation':
      page = renderConsultation()
      break
    case '/settings':
      page = renderSettings()
      break
    default:
      page = renderHome()
  }

  return (
    <div className={`shell text-${settings.textSize}`}>
      <header className="topbar">
        <div className="brand-block">
          <button type="button" className="brand-mark" onClick={() => navigate('/')} aria-label="AI Doctor home">
            <span>+</span>
          </button>
          <div>
            <p className="brand-name">AI Doctor</p>
            <p className="brand-tag">Understand your symptoms. Know what to do next.</p>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          {publicLinks.map((item) => (
            <a key={item.href} href={`#${item.href}`} aria-current={route === item.href ? 'page' : undefined}>
              {item.label}
            </a>
          ))}
          <a href="#/consultation" aria-current={route === '/consultation' ? 'page' : undefined}>
            Check My Symptoms
          </a>
          <a href="#/dashboard" aria-current={route === '/dashboard' ? 'page' : undefined}>
            Dashboard
          </a>
          <a href={isSignedIn ? '#/settings' : '#/sign-in'} aria-current={route === '/settings' || route === '/sign-in' ? 'page' : undefined}>
            {isSignedIn ? 'Settings' : 'Sign In'}
          </a>
        </nav>
      </header>

      {(authError || authInfo) && (
        <div className={`banner ${authError ? 'error-banner' : 'info-banner'}`} role="status">
          {authError || authInfo}
        </div>
      )}

      <main>{page}</main>

      <footer className="footer">
        <div>
          <strong>AI Doctor</strong>
          <p>AI-powered health information to help you understand symptoms and prepare for the right care.</p>
        </div>
        <div>
          <p>{disclosureText}</p>
          <p className="small">Emergency symptoms need real-world urgent assessment.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
