export type StoredConversation<T> = { id: string; title: string; updatedAt: string; messages: T[] }
export const upsertConversation = <T>(items: StoredConversation<T>[], next: StoredConversation<T>) =>
  [next, ...items.filter((item) => item.id !== next.id)].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
export const removeConversation = <T>(items: StoredConversation<T>[], id: string) => items.filter((item)=>item.id!==id)
export const clearConversationData = <T>() : StoredConversation<T>[] => []
