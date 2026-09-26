import { describe, expect, it } from 'vitest'
import { crisisReply, dependencyReply, isCrisis, isDependencyRisk, screenReply } from '../../supabase/functions/chat/policy'

describe('server chat policy', () => {
  it('intercepts crisis and dependency inputs', () => {
    expect(isCrisis('I want to die')).toBe(true)
    expect(isDependencyRisk('you are the only friend I need')).toBe(true)
  })

  it('replaces plainly unsafe generated responses', () => {
    expect(screenReply('You should kill yourself')).toBe(crisisReply)
    expect(screenReply('You belong only to me')).toBe(dependencyReply)
    expect(screenReply('Let us work on your song.')).toBe('Let us work on your song.')
  })
})
