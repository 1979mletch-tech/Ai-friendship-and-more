import { afterEach, describe, expect, it, vi } from 'vitest'
import { createExportBundle, downloadJson } from './exportData'

describe('data export', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })
  it('creates a clearly labelled user export', () => {
    const result = createExportBundle({ messages: [], memory: ['novel'], projectNotes: [], companionName: 'Nova' })
    expect(result.product).toBe('AI Friendship')
    expect(result.memory).toEqual(['novel'])
    expect(result.exportedAt).toBeTruthy()
  })

  it('keeps the download URL alive until after the browser can start the save', () => {
    vi.useFakeTimers()
    const click = vi.fn()
    const remove = vi.fn()
    const appendChild = vi.fn()
    Object.defineProperty(globalThis, 'document', { configurable: true, value: {
      body: { appendChild }, createElement: () => ({ style: {}, click, remove }),
    } })
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    downloadJson('export.json', { ok: true })
    expect(create).toHaveBeenCalledOnce()
    expect(appendChild).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledOnce()
    expect(revoke).not.toHaveBeenCalled()
    vi.advanceTimersByTime(30_000)
    expect(revoke).toHaveBeenCalledWith('blob:export')
  })
})
