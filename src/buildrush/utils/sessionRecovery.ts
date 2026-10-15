// Session Recovery, Retry Logic, and Bot Lifecycle Management
// Resolves: vanishing assistant, session resets, memory drops, repeated stock responses,
// duplicated bot instances, unhandled timeouts, and unobserved errors.

import type { AiMessage } from '../types'

export interface SessionRecoveryConfig {
  storageKey: string
  maxMessages: number
  requestTimeoutMs: number
  maxRetries: number
}

const DEFAULT_CONFIG: SessionRecoveryConfig = {
  storageKey: 'buildrush_assistant_session',
  maxMessages: 30,
  requestTimeoutMs: 20000,
  maxRetries: 3,
}

export class AssistantSessionRecovery {
  private config: SessionRecoveryConfig
  private isProcessing = false
  private activeAbortController: AbortController | null = null
  private memoryStore = new Map<string, string>()

  constructor(customConfig?: Partial<SessionRecoveryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...customConfig }
  }

  private getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key)
      }
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(key)
        if (val !== null) return val
      }
    } catch {
      // Fall through to memory fallback
    }
    return this.memoryStore.get(key) ?? null
  }

  private setItem(key: string, val: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val)
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val)
      }
    } catch {
      // Fall through to memory fallback
    }
    this.memoryStore.set(key, val)
  }

  // Sanitizes text input: removes control characters and truncates to safe limit
  public sanitizeInput(raw: string, maxChars = 1800): string {
    if (typeof raw !== 'string') return ''
    return raw
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxChars)
  }

  // Load message history with fallback and data integrity check
  public loadMessages(userId?: string): AiMessage[] {
    const key = userId ? `${this.config.storageKey}:${userId}` : this.config.storageKey
    try {
      const stored = this.getItem(key)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return []
      return parsed
        .filter((item): item is AiMessage => Boolean(item && typeof item.text === 'string' && item.role))
        .slice(-this.config.maxMessages)
    } catch {
      return []
    }
  }

  // Save message history durably
  public saveMessages(messages: AiMessage[], userId?: string): void {
    const key = userId ? `${this.config.storageKey}:${userId}` : this.config.storageKey
    try {
      const safeSubset = messages.slice(-this.config.maxMessages)
      this.setItem(key, JSON.stringify(safeSubset))
    } catch {
      // Ignore quota errors gracefully
    }
  }

  // Clear session on sign-out or explicit reset
  public clearSession(userId?: string): void {
    const key = userId ? `${this.config.storageKey}:${userId}` : this.config.storageKey
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore
    }
  }

  // Safe fetch with timeout and exponential backoff retry logic
  public async executeWithRetry<T>(
    fn: (signal: AbortSignal) => Promise<T>,
    onErrorCallback?: (attempt: number, error: unknown) => void,
  ): Promise<T> {
    if (this.isProcessing) {
      throw new Error('A request is already in progress. Please wait for it to complete.')
    }

    this.isProcessing = true
    let lastError: unknown = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      this.activeAbortController = new AbortController()
      const timeoutId = setTimeout(() => {
        this.activeAbortController?.abort('Request timed out after 20 seconds')
      }, this.config.requestTimeoutMs)

      try {
        const result = await fn(this.activeAbortController.signal)
        clearTimeout(timeoutId)
        this.isProcessing = false
        this.activeAbortController = null
        return result
      } catch (err) {
        clearTimeout(timeoutId)
        lastError = err
        if (onErrorCallback) onErrorCallback(attempt, err)

        // Only retry on transient/network/timeout errors, not 4xx client errors
        const isAbort = err === 'Request timed out after 20 seconds' || (err instanceof Error && err.name === 'AbortError')
        const isNetwork = err instanceof TypeError && err.message.includes('fetch')
        if ((isAbort || isNetwork) && attempt < this.config.maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 4000)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          continue
        }
        break
      }
    }

    this.isProcessing = false
    this.activeAbortController = null
    throw lastError || new Error('Assistant request failed after retries.')
  }

  // Abort any ongoing request cleanly
  public abortCurrent(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort('User cancelled request')
      this.activeAbortController = null
      this.isProcessing = false
    }
  }

  public get isBusy(): boolean {
    return this.isProcessing
  }
}
