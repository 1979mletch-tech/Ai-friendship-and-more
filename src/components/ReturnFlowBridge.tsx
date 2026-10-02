import { useEffect, useState } from 'react'
import { getBillingPlan } from '../services/billingService'
import { loadSession, refreshSession, saveSession } from '../services/authService'
import { finishAgeVerification, hasPendingAgeVerification } from '../services/ageVerificationService'
import { clearReturnFlowFromUrl, parseReturnFlow } from '../utils/returnFlow'

type FlowState = 'idle' | 'working' | 'success' | 'pending' | 'cancelled' | 'error'

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function ReturnFlowBridge() {
  const [state, setState] = useState<FlowState>('idle')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const flow = parseReturnFlow(window.location.search)
    if (!flow) return
    let active = true

    const run = async () => {
      const session = loadSession()
      if (!session) {
        if (!active) return
        setState('error')
        setMessage('Sign in again to finish this account step.')
        return
      }

      const userId = session.user.id
      const stillSameAccount = () => active && loadSession()?.user.id === userId

      setState('working')
      if (flow.kind === 'billing-cancel') {
        clearReturnFlowFromUrl()
        if (!stillSameAccount()) return
        setState('cancelled')
        setMessage('Checkout was cancelled. No plan change was made.')
        window.location.hash = '/pricing'
        return
      }


      if (flow.kind === 'age-return') {
        if (!hasPendingAgeVerification(session)) {
          clearReturnFlowFromUrl()
          if (!stillSameAccount()) return
          setState('pending')
          setMessage('No pending age check was found on this device. You can start or check verification from Account.')
          window.location.hash = '/account'
          return
        }
        try {
          const result = await finishAgeVerification(session)
          if (!stillSameAccount()) return
          if (result.verified) {
            try {
              const fresh = await refreshSession(session)
              if (!stillSameAccount() || fresh.user.id !== userId) return
              saveSession(fresh)
            } catch {
              // The server-side adult flag is already saved; a later auth refresh can pick it up.
            }
            clearReturnFlowFromUrl()
            setState('success')
            setMessage('Adult verification is complete. Aurora live access is ready to continue.')
            window.location.hash = '/chat'
            window.setTimeout(() => window.location.reload(), 450)
            return
          }
          setState('pending')
          setMessage(result.status === 'not-eligible'
            ? 'Adult eligibility could not be confirmed.'
            : 'Verification is still processing. Use Retry status in a moment.')
          return
        } catch (error) {
          if (!stillSameAccount()) return
          setState('error')
          setMessage(error instanceof Error ? error.message : 'Could not finish age verification.')
          return
        }
      }

      if (flow.kind === 'billing-success' || flow.kind === 'billing-portal') {
        const delays = flow.kind === 'billing-success' ? [0, 700, 1400, 2500, 4000] : [0, 900]
        for (const delay of delays) {
          if (delay) await wait(delay)
          if (!stillSameAccount()) return
          try {
            const plan = await getBillingPlan(session)
            if (!stillSameAccount()) return
            if (plan !== 'free') {
              clearReturnFlowFromUrl()
              if (!stillSameAccount()) return
              setState('success')
              setMessage(`Paid access is active (${plan.replace('pro-', '')}). Aurora is ready.`)
              window.location.hash = flow.kind === 'billing-success' ? '/chat' : '/pricing'
              window.setTimeout(() => window.location.reload(), 450)
              return
            }
          } catch (error) {
            if (delay === delays.at(-1)) {
              setState('error')
              setMessage(error instanceof Error ? error.message : 'Could not refresh subscription status.')
              return
            }
          }
        }
        if (!stillSameAccount()) return
        setState('pending')
        setMessage(flow.kind === 'billing-success'
          ? 'Stripe returned successfully, but paid access is still waiting for server confirmation. Retry status shortly.'
          : 'Billing changes are still being confirmed. Retry status shortly.')
      }
    }

    void run()
    return () => { active = false }
  }, [retry])

  if (state === 'idle') return null

  return (
    <aside className={`return-flow return-flow-${state}`} role="status" aria-live="polite">
      <strong>{state === 'working' ? 'Checking your account…' : state === 'success' ? 'Account updated' : state === 'cancelled' ? 'Checkout cancelled' : state === 'pending' ? 'Still confirming' : 'Account check needed'}</strong>
      {message && <span>{message}</span>}
      {(state === 'pending' || state === 'error') && (
        <button type="button" onClick={() => setRetry((value) => value + 1)}>Retry status</button>
      )}
    </aside>
  )
}
