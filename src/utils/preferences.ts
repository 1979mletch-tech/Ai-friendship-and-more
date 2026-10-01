export type CompanionTone = 'warm' | 'calm' | 'creative' | 'direct'

export type CompanionPreferences = {
  tone: CompanionTone
  interests: string
  memoryEnabled: boolean
}

export const defaultPreferences: CompanionPreferences = {
  tone: 'warm',
  interests: '',
  memoryEnabled: true,
}

export const sanitizePreferences = (value: Partial<CompanionPreferences>): CompanionPreferences => ({
  tone: ['warm','calm','creative','direct'].includes(String(value.tone)) ? value.tone as CompanionTone : 'warm',
  interests: String(value.interests || '').replace(/[<>\u0000]/g, '').trim().slice(0, 500),
  memoryEnabled: value.memoryEnabled !== false,
})
