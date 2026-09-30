import { describe, expect, it } from 'vitest'
import { hasCloudAuth, readCloudConfig } from './cloud'

describe('cloud config', () => {
  it('is disabled when public cloud values are absent', () => {
    expect(hasCloudAuth(readCloudConfig({}))).toBe(false)
  })

  it('normalizes a configured Supabase URL', () => {
    const config = readCloudConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co/',
      VITE_SUPABASE_ANON_KEY: 'public-anon',
      VITE_CHAT_API_URL: 'https://example.supabase.co/functions/v1/chat',
    })
    expect(config.supabaseUrl).toBe('https://example.supabase.co')
    expect(hasCloudAuth(config)).toBe(true)
    expect(config.chatApiUrl).toMatch(/functions\/v1\/chat/)
  })
})
