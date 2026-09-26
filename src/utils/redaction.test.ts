import { describe, expect, it } from 'vitest'
import { redactForLog, safeErrorMessage } from './redaction'

describe('diagnostic redaction', () => {
  it('redacts bearer tokens and named secrets', () => {
    expect(redactForLog('Bearer abc.def token=hello password:world')).not.toContain('abc.def')
    expect(redactForLog('Bearer abc.def token=hello password:world')).not.toContain('hello')
    expect(redactForLog('Bearer abc.def token=hello password:world')).not.toContain('world')
  })
  it('returns safe generic unknown errors', () => {
    expect(safeErrorMessage('bad')).toBe('Unexpected error.')
  })
})
