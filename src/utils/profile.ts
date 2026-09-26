export type CompanionTone = 'warm' | 'calm' | 'creative' | 'direct'
export const validTone = (value: unknown): CompanionTone => ['warm','calm','creative','direct'].includes(String(value)) ? value as CompanionTone : 'warm'
export const sanitizeProfile = (input: { companionName?: unknown; tone?: unknown; interests?: unknown; memoryEnabled?: unknown }) => ({
  companionName: typeof input.companionName === 'string' ? input.companionName.replace(/[<>]/g,'').trim().slice(0,32) || 'Friend' : 'Friend',
  tone: validTone(input.tone),
  interests: typeof input.interests === 'string' ? input.interests.replace(/[<>]/g,'').trim().slice(0,500) : '',
  memoryEnabled: input.memoryEnabled !== false,
})
