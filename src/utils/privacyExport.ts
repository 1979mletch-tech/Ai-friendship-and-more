import { hasForbiddenExportKeys } from './exportPolicy'
export type ExportBundle = {
  exportedAt: string
  companion: unknown
  conversations: unknown
  memories: unknown
}
export const buildDataExport = (companion: unknown, conversations: unknown, memories: unknown): ExportBundle => ({
  exportedAt: new Date().toISOString(), companion, conversations, memories,
})
export const serializeDataExport = (bundle: ExportBundle) => { if (hasForbiddenExportKeys(bundle)) throw new Error('Export blocked because credential-shaped data was detected.'); return JSON.stringify(bundle, null, 2) }
