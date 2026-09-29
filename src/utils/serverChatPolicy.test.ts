import { describe, expect, it } from 'vitest'
import { crisisContactReply, crisisReply, dependencyReply, isCrisis, isCrisisContactFollowUp, isDependencyRisk, screenReply } from '../../supabase/functions/chat/policy'

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
  it('retains contact guidance at the server boundary after a crisis turn', () => {
    expect(isCrisisContactFollowUp('Please give me contact details', ['I am suicidal'])).toBe(true)
    expect(isCrisisContactFollowUp('I need someone to talk to', ['I am suicidal'])).toBe(true)
    expect(crisisContactReply).toMatch(/999 or 112.*111.*116 123/)
    expect(isCrisisContactFollowUp('Call me later', ['Help with my project'])).toBe(false)
  })
})
