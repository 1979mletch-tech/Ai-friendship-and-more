export const LIMITS = {
  chatInput: 2000,
  liveContextMessages: 24,
  companionName: 32,
  memoryItem: 500,
  memoryItems: 50,
  conversationTitle: 120,
  profileInterests: 500,
} as const

export const withinLimit = (value: string, limit: number) => value.length <= limit
