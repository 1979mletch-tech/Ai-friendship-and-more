export type ProjectContextNote = {
  project: string
  tags: string
  note: string
}

export type AuroraChatContext = {
  memory: string[]
  projectNotes: ProjectContextNote[]
}

const cleanText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') return ''
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export const prepareAuroraChatContext = (
  memoryItems: unknown[],
  projectNotes: unknown[],
): AuroraChatContext => {
  const memory = [...new Set(
    memoryItems
      .map((item) => cleanText(item, 240))
      .filter(Boolean),
  )].slice(-12)

  const notes = projectNotes
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      project: cleanText(item.project, 80),
      tags: cleanText(item.tags, 120),
      note: cleanText(item.note, 320),
    }))
    .filter((item) => item.project && item.note)
    .slice(-6)

  return { memory, projectNotes: notes }
}
