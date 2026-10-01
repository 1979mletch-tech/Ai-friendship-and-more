import { describe,expect,it } from 'vitest'
import { safeAnalyticsEvent,stripSensitiveFields } from './privacyGuard'
describe('privacy guard',()=>{it('strips nested secrets',()=>expect(stripSensitiveFields({name:'x',password:'p',nested:{accessToken:'t',ok:1}})).toEqual({name:'x',nested:{ok:1}}));it('sanitizes event names',()=>expect(safeAnalyticsEvent('chat sent!')).toBe('chatsent'))})
