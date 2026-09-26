import { describe,expect,it } from 'vitest'
import { chatFailureCopy,classifyChatFailure } from './chatFailure'
describe('chat failures',()=>{it('classifies auth',()=>expect(classifyChatFailure(401)).toBe('unauthorized'));it('classifies rate limit',()=>expect(classifyChatFailure(429)).toBe('rate-limit'));it('classifies provider',()=>expect(classifyChatFailure(503)).toBe('provider'));it('keeps fallback copy honest',()=>expect(chatFailureCopy('provider')).toContain('Local fallback'))})
