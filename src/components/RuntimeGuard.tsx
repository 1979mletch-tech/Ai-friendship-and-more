import { useEffect, useRef, useState } from 'react'
import { ensureFreshSession, loadSession, saveSession } from '../services/authService'

export function RuntimeGuard() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)
  const [sessionIssue, setSessionIssue] = useState('')
  const refreshing = useRef(false)

  useEffect(() => {
    let active = true

    const refreshIfNeeded = async () => {
      if (!navigator.onLine || refreshing.current) return
      const session = loadSession()
      if (!session) { if (active) setSessionIssue(''); return }
      refreshing.current = true
      try {
        const fresh = await ensureFreshSession(session)
        if (!active) return
        saveSession(fresh)
        setSessionIssue('')
      } catch {
        if (active) setSessionIssue('Your sign-in needs refreshing. Open Account and sign in again before sending private messages.')
      } finally {
        refreshing.current = false
      }
    }

    const handleOnline = () => { setOnline(true); void refreshIfNeeded() }
    const handleOffline = () => setOnline(false)
    const handleVisibility = () => { if (document.visibilityState === 'visible') void refreshIfNeeded() }
    const handleFocus = () => { void refreshIfNeeded() }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    void refreshIfNeeded()

    return () => {
      active = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  if (online && !sessionIssue) return null

  return (
    <aside className={`runtime-guard ${online ? 'runtime-guard-session' : 'runtime-guard-offline'}`} role="status" aria-live="polite">
      {!online ? (
        <><strong>You’re offline.</strong><span>Aurora will be ready again when this device reconnects. Anything already stored locally stays on this device.</span></>
      ) : (
        <><strong>Sign-in check needed.</strong><span>{sessionIssue}</span><a href="#/account">Open Account</a></>
      )}
    </aside>
  )
}
