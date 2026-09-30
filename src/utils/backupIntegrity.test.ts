import { describe,expect,it } from 'vitest'
import { backupEnvelope,isBackupEnvelope } from './backupIntegrity'
describe('backup integrity',()=>{it('creates recognizable envelope',()=>expect(isBackupEnvelope(backupEnvelope({a:1}))).toBe(true));it('rejects foreign product',()=>expect(isBackupEnvelope({schemaVersion:1,product:'Other',data:{}})).toBe(false));it('rejects null',()=>expect(isBackupEnvelope(null)).toBe(false))})
