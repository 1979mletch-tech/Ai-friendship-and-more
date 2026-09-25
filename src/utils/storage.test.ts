import { beforeEach, describe, expect, it } from 'vitest'
import { safeLocalStorageGet, safeLocalStorageSet } from './storage'

type Store = Record<string, string>

const createMockLocalStorage = () => {
  let store: Store = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

describe('safeLocalStorage helpers', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMockLocalStorage(),
      configurable: true,
      writable: true,
    })
  })

  it('restores valid JSON payloads', () => {
    safeLocalStorageSet('messages', [{ id: '1', role: 'user' }])
    const result = safeLocalStorageGet('messages', [])
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
  })

  it('falls back when payload is malformed', () => {
    localStorage.setItem('notes', '{invalid-json')
    const result = safeLocalStorageGet('notes', [{ id: 'fallback' }])
    expect(result).toEqual([{ id: 'fallback' }])
  })
})
