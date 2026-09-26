import { describe, expect, it } from 'vitest'
import { buildDataExport, serializeDataExport } from './privacyExport'
describe('privacy export',()=>{
 it('exports only supplied user data',()=>{const out=serializeDataExport(buildDataExport({name:'Friend'},[{id:'c1'}],[{id:'m1'}])); expect(out).toContain('"c1"'); expect(out).toContain('"m1"'); expect(out).not.toContain('password')})
})
