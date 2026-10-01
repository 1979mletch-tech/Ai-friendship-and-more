export const sanitizeMemoryItem = (value: string) =>
  value.replace(/[<>\u0000]/g, '').replace(/\s+/g, ' ').trim().slice(0, 500)

export const addMemoryItem = (items: string[], value: string, maxItems = 50) => {
  const clean = sanitizeMemoryItem(value)
  if (!clean) return items
  const withoutDuplicate = items.filter((item) => item.toLocaleLowerCase() !== clean.toLocaleLowerCase())
  return [...withoutDuplicate, clean].slice(-maxItems)
}

export const removeMemoryItem = (items: string[], value: string) =>
  items.filter((item) => item !== value)
