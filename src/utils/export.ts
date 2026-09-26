import type { Conversation } from './conversations'

type ExportData = {
  companionName: string
  conversations: Conversation[]
  projectNotes: { id: string; project: string; tags: string; note: string }[]
}

export const serializeLocalData = (data: ExportData): string => JSON.stringify({
  format: 'ai-friendship-local-export-v1',
  exportedAt: new Date().toISOString(),
  ...data,
}, null, 2)

export const downloadLocalData = (data: ExportData): void => {
  const url = URL.createObjectURL(new Blob([serializeLocalData(data)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `ai-friendship-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
