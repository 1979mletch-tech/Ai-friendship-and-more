export type CompanionTone = 'warm' | 'calm' | 'upbeat'
export type CompanionProfile = { name: string; tone: CompanionTone; interests: string }

export const sanitizeCompanionProfile = (profile: CompanionProfile): CompanionProfile => ({
  name: profile.name.trim().slice(0, 30) || 'Friend',
  tone: ['warm', 'calm', 'upbeat'].includes(profile.tone) ? profile.tone : 'warm',
  interests: profile.interests.trim().slice(0, 300),
})

export const companionContext = (profile: CompanionProfile): string => {
  const safe = sanitizeCompanionProfile(profile)
  return `Companion display name: ${safe.name}. Tone: ${safe.tone}. User-approved interests: ${safe.interests || 'none saved'}.`
}
