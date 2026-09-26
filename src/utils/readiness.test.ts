import { describe, expect, it } from 'vitest'
import { getStagingReadiness } from './readiness'

describe('staging readiness', () => {
  it('reports missing cloud and AI configuration', () => {
    const result = getStagingReadiness({ supabaseUrl: '', supabaseAnonKey: '', chatApiUrl: '' }, 'https:')
    expect(result.cloudConfigured).toBe(false)
    expect(result.chatConfigured).toBe(false)
    expect(result.warnings).toHaveLength(2)
  })
  it('recognizes configured HTTPS staging', () => {
    const result = getStagingReadiness({ supabaseUrl: 'https://db.example', supabaseAnonKey: 'public', chatApiUrl: 'https://api.example' }, 'https:')
    expect(result).toMatchObject({ cloudConfigured: true, chatConfigured: true, https: true, warnings: [] })
  })
})
