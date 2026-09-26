import { describe,expect,it } from 'vitest'
import { aiIdentityCopy,dependencyBoundary,secretsBoundary } from './safetyBoundary'
describe('safety boundaries',()=>{it('states AI identity',()=>expect(aiIdentityCopy('Nova')).toContain('AI companion'));it('rejects exclusivity',()=>expect(dependencyBoundary()).toContain('exclusive'));it('protects secrets',()=>expect(secretsBoundary).toContain('API keys'))})
