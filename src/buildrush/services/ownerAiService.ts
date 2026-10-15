// Client Service for BuildRush Private Owner/Admin AI (AI Assistant 2)
// Strictly enforces owner role check, audit trail logging, and sensitive action confirmation.

import { AssistantSessionRecovery } from '../utils/sessionRecovery'
import type {
  AiMessage,
  OwnerOperationalMetrics,
  SensitiveActionProposal,
} from '../types'

export type OwnerDashboardMetrics = {
  [Key in keyof OwnerOperationalMetrics]?: OwnerOperationalMetrics[Key] | null
}

export interface OwnerAiResponse {
  reply: string
  isAi: true
  modelLive: boolean
  proposal?: SensitiveActionProposal | null
  error?: string
}

export class OwnerAiService {
  private recovery: AssistantSessionRecovery
  private messages: AiMessage[] = []
  private endpointUrl: string

  constructor(endpointUrl = '/functions/v1/buildrush-owner-ai') {
    this.endpointUrl = endpointUrl
    this.recovery = new AssistantSessionRecovery({
      storageKey: 'buildrush_owner_ai_history',
      maxMessages: 30,
      requestTimeoutMs: 20000,
      maxRetries: 2,
    })
    this.messages = this.recovery.loadMessages()
  }

  public getMessages(): AiMessage[] {
    return [...this.messages]
  }

  public clearHistory(): void {
    this.messages = []
    this.recovery.clearSession()
  }

  public async sendOwnerMessage(text: string, authToken: string): Promise<OwnerAiResponse> {
    const clean = this.recovery.sanitizeInput(text, 2000)
    if (!clean) {
      throw new Error('Message cannot be empty.')
    }
    if (!authToken) {
      throw new Error('Authentication required: Owner session missing.')
    }

    const userMessage: AiMessage = {
      id: 'owner-msg-' + Date.now(),
      role: 'user',
      text: clean,
      createdAt: new Date().toISOString(),
    }

    this.messages.push(userMessage)
    this.recovery.saveMessages(this.messages)

    try {
      const response = await this.recovery.executeWithRetry<OwnerAiResponse>(async (signal) => {
        const res = await fetch(this.endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authToken,
          },
          body: JSON.stringify({
            messages: this.messages.slice(-20).map((m) => ({ role: m.role, text: m.text })),
          }),
          signal,
        })

        if (res.status === 403) {
          throw new Error('Forbidden: You do not have owner authorization to access this assistant.')
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Server returned status ' + res.status)
        }

        return (await res.json()) as OwnerAiResponse
      })

      const assistantMessage: AiMessage = {
        id: 'owner-reply-' + Date.now(),
        role: 'assistant',
        text: response.reply,
        metadata: {
          isAi: true,
          modelLive: response.modelLive,
          proposal: response.proposal,
        },
        createdAt: new Date().toISOString(),
      }

      this.messages.push(assistantMessage)
      this.recovery.saveMessages(this.messages)

      return response
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error communicating with Owner AI'
      return {
        reply: 'Owner AI Service Alert: ' + msg,
        isAi: true,
        modelLive: false,
        error: msg,
      }
    }
  }

  // Explicit confirmation workflow for sensitive actions (never executed silently)
  public async confirmAndLogProposal(
    proposal: SensitiveActionProposal,
    authToken: string,
  ): Promise<{ success: boolean; executed: false; message: string; auditLogId?: string }> {
    if (!proposal.requiresOwnerConfirmation) {
      throw new Error('Action does not require confirmation.')
    }

    const res = await fetch(this.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + authToken,
      },
      body: JSON.stringify({
        action: 'confirm_sensitive_action',
        proposal,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to execute confirmed action.')
    }

    const data = await res.json()
    if (data.executed !== false) {
      throw new Error('Action execution is not available; the server did not confirm this was a log-only request.')
    }
    return {
      success: true,
      executed: false,
      message: data.message || 'Proposal confirmed and logged. No business action was executed.',
      auditLogId: data.auditLogId,
    }
  }

  public async getDashboard(authToken: string): Promise<OwnerDashboardMetrics> {
    if (!authToken) {
      throw new Error('Owner authorization token required.')
    }

    const res = await fetch(this.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + authToken,
      },
      body: JSON.stringify({ action: 'get_dashboard' }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Unable to load owner dashboard.')
    }

    const data = await res.json()
    if (!data?.metrics || typeof data.metrics !== 'object') {
      throw new Error('Owner dashboard returned no operational data.')
    }
    return data.metrics as OwnerDashboardMetrics
  }

  // Alias for sendMessage (throws on error for programmatic verification)
  public async sendMessage(
    text: string,
    authToken?: string,
  ): Promise<OwnerAiResponse> {
    if (!authToken) {
      throw new Error('Owner authorization token required.')
    }
    const response = await this.sendOwnerMessage(text, authToken)
    if (response.error) {
      throw new Error(response.error)
    }
    return response
  }
}

export const ownerAiService = new OwnerAiService()

export function detectSensitiveAction(text: string): { isSensitive: boolean; actionType?: string } {
  const SENSITIVE_PATTERNS = [
    { type: 'refund', pattern: /refund|money movement|reimburse/i },
    { type: 'suspend_account', pattern: /suspend|ban|block user|deactivate account/i },
    { type: 'delete_record', pattern: /delete.*account|delete.*job|wipe.*data|purge/i },
    { type: 'mass_message', pattern: /broadcast|mass message|notify all|blast/i },
    { type: 'policy_update', pattern: /change policy|update rule|modify fee|change commission/i },
  ]

  for (const item of SENSITIVE_PATTERNS) {
    if (item.pattern.test(text)) {
      return { isSensitive: true, actionType: item.type }
    }
  }
  return { isSensitive: false }
}
