import { describe,expect,it } from 'vitest'
import { canClaimLive,evidenceCopy,evidenceRank } from './releaseEvidence'
describe('release evidence',()=>{it('reserves live claim',()=>expect(canClaimLive('configured')).toBe(false));it('allows live tested',()=>expect(canClaimLive('live-tested')).toBe(true));it('ranks live above code',()=>expect(evidenceRank('live-tested')).toBeGreaterThan(evidenceRank('code-built')));it('formats label',()=>expect(evidenceCopy('ci-verified')).toContain('CI'))})
