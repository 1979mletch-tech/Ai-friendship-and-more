export type ExportBundle = {
  exportedAt: string
  product: 'AI Friendship'
  messages: unknown[]
  memory: string[]
  projectNotes: unknown[]
  companionName: string
}

export const createExportBundle = (input: Omit<ExportBundle, 'exportedAt' | 'product'>): ExportBundle => ({
  product: 'AI Friendship',
  exportedAt: new Date().toISOString(),
  ...input,
})

export const downloadJson = (filename: string, value: unknown) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Mobile browsers may not start the download before the click handler returns.
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
