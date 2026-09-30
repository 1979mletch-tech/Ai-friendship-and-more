import { describe, expect, it } from 'vitest'
import { cloudStatusCopy } from './cloudStatus'
describe('cloud evidence labels',()=>{it('does not call configured cloud verified',()=>expect(cloudStatusCopy('ready-for-test')).toContain('awaiting live verification'))})
