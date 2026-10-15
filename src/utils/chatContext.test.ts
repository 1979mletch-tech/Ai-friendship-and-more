import { describe, expect, it } from 'vitest'
import { prepareAuroraChatContext } from './chatContext'

describe('Aurora chat context packaging', () => {
  it('deduplicates, trims and caps approved memory', () => {
    const input = ['  likes trance music  ', 'likes trance music', '', ...Array.from({ length: 20 }, (_, i) => `memory ${i}`)]
    const context = prepareAuroraChatContext(input, [])
    expect(context.memory).toHaveLength(12)
    expect(context.memory.at(-1)).toBe('memory 19')
    expect(context.memory.some((item) => item === '')).toBe(false)
  })

  it('accepts only usable project notes and caps context size', () => {
    const notes = Array.from({ length: 10 }, (_, i) => ({ project: `Project ${i}`, tags: 'idea', note: `Note ${i}` }))
    notes.push({ project: '', tags: 'bad', note: 'ignored' })
    const context = prepareAuroraChatContext([], notes)
    expect(context.projectNotes).toHaveLength(6)
    expect(context.projectNotes[0]?.project).toBe('Project 4')
    expect(context.projectNotes.at(-1)?.project).toBe('Project 9')
  })

  it('removes control characters and truncates oversized values', () => {
    const context = prepareAuroraChatContext(['hello\u0000world' + 'x'.repeat(300)], [
      { project: 'P', tags: 'tag', note: 'n'.repeat(500) },
    ])
    expect(context.memory[0]).not.toContain('\u0000')
    expect(context.memory[0]?.length).toBeLessThanOrEqual(240)
    expect(context.projectNotes[0]?.note.length).toBeLessThanOrEqual(320)
  })
})
