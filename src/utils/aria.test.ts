import { describe, expect, it } from 'vitest'
import { messageAriaLabel, statusAnnouncement } from './aria'
describe('accessible chat copy',()=>{it('labels AI messages',()=>expect(messageAriaLabel('assistant','Nova')).toBe('Nova AI response'));it('announces errors',()=>expect(statusAnnouncement(false,'offline')).toContain('offline'))})
