import { describe,expect,it } from 'vitest'
import { localStorageWarning,shouldPersistSensitiveDrafts } from './devicePrivacy'
describe('device privacy',()=>{it('warns on shared devices',()=>expect(localStorageWarning(true)).toContain('shared-device'));it('never persists sensitive drafts',()=>expect(shouldPersistSensitiveDrafts()).toBe(false))})
