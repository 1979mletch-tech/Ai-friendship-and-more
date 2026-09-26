export type ExportBundle = {
  exportedAt: string
  companion: unknown
  conversations: unknown
  memories: unknown
}
export const buildDataExport = (companion: unknown, conversations: unknown, memories: unknown): ExportBundle => ({
  exportedAt: new Date().toISOString(), companion, conversations, memories,
})
export const serializeDataExport = (bundle: ExportBundle) => JSON.stringify(bundle, null, 2)
