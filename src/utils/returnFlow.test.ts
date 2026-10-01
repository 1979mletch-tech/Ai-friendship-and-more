import { describe, expect, it } from 'vitest'
import { parseReturnFlow, withReturnMarker } from './returnFlow'

describe('return flow helpers', () => {
  it('recognizes only known return markers', () => {
    expect(parseReturnFlow('?return=billing-success')).toEqual({ kind: 'billing-success' })
    expect(parseReturnFlow('?return=age-return')).toEqual({ kind: 'age-return' })
    expect(parseReturnFlow('?return=javascript:bad')).toBeNull()
    expect(parseReturnFlow('')).toBeNull()
  })

  it('adds a marker to a trusted base URL without replacing its path', () => {
    expect(withReturnMarker('https://example.test/app/', 'billing-cancel')).toBe('https://example.test/app/?return=billing-cancel')
  })
})
