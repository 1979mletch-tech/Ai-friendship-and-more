import { describe, expect, it } from 'vitest'
import { buildExportFilename, DATA_EXPORT_VERSION } from './version'

describe('data versioning', () => {
  it('has an explicit export schema version', () => expect(DATA_EXPORT_VERSION).toBe(1))
  it('builds a dated portable filename', () => {
    expect(buildExportFilename(new Date('2026-09-26T10:00:00Z'))).toBe('ai-friendship-data-2026-09-26.json')
  })
})
