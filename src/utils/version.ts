export const DATA_EXPORT_VERSION = 1
export const APP_DATA_NAMESPACE = 'ai_friendship'

export const buildExportFilename = (date = new Date()) =>
  `ai-friendship-data-${date.toISOString().slice(0, 10)}.json`
