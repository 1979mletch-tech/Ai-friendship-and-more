import { describe,expect,it } from 'vitest'
import { normalizeTheme,resolvedTheme } from './theme'
describe('theme preference',()=>{it('defaults invalid to system',()=>expect(normalizeTheme('neon')).toBe('system'));it('resolves system dark',()=>expect(resolvedTheme('system',true)).toBe('dark'));it('respects explicit light',()=>expect(resolvedTheme('light',true)).toBe('light'))})
