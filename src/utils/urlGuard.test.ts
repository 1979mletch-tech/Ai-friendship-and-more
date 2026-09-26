import { describe,expect,it } from 'vitest'
import { isHttpsUrl,sameOriginUrl,stripUrlQuery } from './urlGuard'
describe('url guard',()=>{it('requires https',()=>{expect(isHttpsUrl('https://a.com')).toBe(true);expect(isHttpsUrl('http://a.com')).toBe(false)});it('checks origin',()=>expect(sameOriginUrl('/chat','https://a.com')).toBe(true));it('rejects other origin',()=>expect(sameOriginUrl('https://b.com','https://a.com')).toBe(false));it('strips query and hash',()=>expect(stripUrlQuery('https://a.com/x?token=secret#x')).toBe('https://a.com/x'))})
