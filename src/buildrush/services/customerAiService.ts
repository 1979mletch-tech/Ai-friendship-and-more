// Client Service for BuildRush Customer & Tradesperson AI (AI Assistant 1)
// Handles session recovery, retry logic, timeout protection, and Layer 2 persistence.

import { AssistantSessionRecovery } from '../utils/sessionRecovery'
import { PRICING_DISCLAIMER, getPriceGuidanceForTrade } from '../config/pricingGuidance'
import type { AiMessage } from '../types'

export interface CustomerAiResponse {
  reply: string
  isAi: true
  modelLive: boolean
  escalateToHuman: boolean
  error?: string
}

export class CustomerAiService {
  private recovery: AssistantSessionRecovery
  private messages: AiMessage[] = []
  private endpointUrl: string

  constructor(endpointUrl = '/functions/v1/buildrush-customer-ai') {
    this.endpointUrl = endpointUrl
    this.recovery = new AssistantSessionRecovery({
      storageKey: 'buildrush_customer_ai_history',
      maxMessages: 24,
      requestTimeoutMs: 20000,
      maxRetries: 3,
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

  public async sendMessage(
    text: string,
    authToken?: string,
    onProgress?: (status: string) => void,
  ): Promise<CustomerAiResponse> {
    const clean = this.recovery.sanitizeInput(text)
    if (!clean) {
      throw new Error('Message cannot be empty.')
    }

    const userMessage: AiMessage = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      role: 'user',
      text: clean,
      createdAt: new Date().toISOString(),
    }

    this.messages.push(userMessage)
    this.recovery.saveMessages(this.messages)

    if (onProgress) onProgress('Thinking...')

    try {
      const result = await this.recovery.executeWithRetry<CustomerAiResponse>(async (signal) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (authToken) {
          headers.Authorization = 'Bearer ' + authToken
        }

        const response = await fetch(this.endpointUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: this.messages.slice(-16).map((m) => ({ role: m.role, text: m.text })),
          }),
          signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Server responded with status ' + response.status)
        }

        return (await response.json()) as CustomerAiResponse
      })

      const assistantMessage: AiMessage = {
        id: 'ast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        role: 'assistant',
        text: result.reply,
        metadata: {
          isAi: true,
          modelLive: result.modelLive,
          escalateToHuman: result.escalateToHuman,
        },
        createdAt: new Date().toISOString(),
      }

      this.messages.push(assistantMessage)
      this.recovery.saveMessages(this.messages)

      return result
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error communicating with assistant'

      // Fallback local response if network completely fails
      const fallbackReply = this.generateLocalFallback(clean)
      const assistantFallbackMessage: AiMessage = {
        id: 'fallback-' + Date.now(),
        role: 'assistant',
        text: fallbackReply,
        metadata: {
          isAi: true,
          modelLive: false,
          fallbackReason: errorMessage,
        },
        createdAt: new Date().toISOString(),
      }

      this.messages.push(assistantFallbackMessage)
      this.recovery.saveMessages(this.messages)

      return {
        reply: fallbackReply,
        isAi: true,
        modelLive: false,
        escalateToHuman: false,
        error: errorMessage,
      }
    }
  }

  // Grounded local advisory fallback when network or edge endpoint is unreachable
  private generateLocalFallback(input: string): string {
    const lower = input.toLowerCase()

    for (const tradeKey of ['plumbing', 'electrical', 'roofing', 'carpentry', 'plastering', 'painting']) {
      if (lower.includes(tradeKey)) {
        const guidance = getPriceGuidanceForTrade(tradeKey)
        if (guidance) {
          const sample = guidance.commonRepairs[0]
          return (
            'BuildRush Assistant (Advisory): For ' + guidance.trade + ', typical UK rates range between ' +
            '£' + guidance.typicalHourlyMin + ' and £' + guidance.typicalHourlyMax + ' per hour. For example, a ' +
            sample.job.toLowerCase() + ' is typically around £' + sample.typicalMinGbp + '–£' + sample.typicalMaxGbp + '. ' +
            PRICING_DISCLAIMER
          )
        }
      }
    }

    return (
      'BuildRush Assistant (Advisory): I am here to help you post jobs, set realistic budgets, and connect with tradespeople. ' +
      'You always set your own proposed budget, and tradespeople quote directly. We aim for prompt repairs (today, tomorrow, or within 48h where feasible). ' +
      PRICING_DISCLAIMER
    )
  }
}
