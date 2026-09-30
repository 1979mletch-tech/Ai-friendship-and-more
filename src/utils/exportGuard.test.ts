import { describe,expect,it } from 'vitest'
import { exportSizeOk,safeExportFilename } from './exportGuard'
describe('export guard',()=>{it('sanitizes filename',()=>expect(safeExportFilename('../My data.json')).toBe('..-My-data.json'));it('does not duplicate extension',()=>expect(safeExportFilename('data.json')).toBe('data.json'));it('enforces byte limit',()=>expect(exportSizeOk('x'.repeat(11),10)).toBe(false))})
