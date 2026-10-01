import { describe,expect,it } from 'vitest'
import { isPreviewHost,stagingBanner } from './stagingBanner'
describe('staging banner',()=>{it('labels pages host',()=>expect(stagingBanner('1979mletch-tech.github.io')).toContain('TEST ENVIRONMENT'));it('labels localhost',()=>expect(isPreviewHost('localhost')).toBe(true));it('does not guess unknown host',()=>expect(isPreviewHost('example.com')).toBe(false))})
