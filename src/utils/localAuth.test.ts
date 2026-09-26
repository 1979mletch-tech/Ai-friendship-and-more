import { describe, expect, it } from 'vitest'
import { hashCredential } from './localAuth'

describe('local auth helpers', () => {
  it('creates stable hashes for the same credential', async () => {
    const one = await hashCredential('Person@example.com', 'correct horse battery staple')
    const two = await hashCredential('person@example.com', 'correct horse battery staple')
    expect(one).toBe(two)
  })

  it('changes hash when password changes', async () => {
    const one = await hashCredential('person@example.com', 'password-one')
    const two = await hashCredential('person@example.com', 'password-two')
    expect(one).not.toBe(two)
  })
})
