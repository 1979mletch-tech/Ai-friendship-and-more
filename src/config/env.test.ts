import { describe, expect, it } from 'vitest'
import { readAppEnv } from './env'

describe('app env', () => {
  it('defaults to safe local preview without an API URL', () => {
    expect(readAppEnv({})).toEqual({ apiBaseUrl: '', authMode: 'local-preview' })
  })
  it('enables server mode only explicitly', () => {
    expect(readAppEnv({ VITE_API_BASE_URL: 'https://api.example/', VITE_AUTH_MODE: 'server' })).toEqual({ apiBaseUrl: 'https://api.example', authMode: 'server' })
  })
})
