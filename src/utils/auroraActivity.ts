export type AuroraScene = 'together' | 'walk' | 'exercise' | 'relax' | 'sleep'
export type AuroraDaypart = 'morning' | 'day' | 'evening' | 'night'

const activityPatterns: Array<{ scene: Exclude<AuroraScene, 'together'>; pattern: RegExp }> = [
  { scene: 'sleep', pattern: /\b(bedtime|go(?:ing)? to bed|good ?night|sleep(?:ing)?|nap|lie down|tired and heading to bed)\b/i },
  { scene: 'exercise', pattern: /\b(work ?out|exercise|stretch(?:ing)?|yoga|gym|training|warm ?up|cool ?down)\b/i },
  { scene: 'walk', pattern: /\b(go for a walk|going for a walk|walk(?:ing)?|stroll|steps|walk with me|outside for a walk)\b/i },
  { scene: 'relax', pattern: /\b(relax(?:ing)?|unwind|chill|sit down|settle down|sofa|quiet time|take it easy)\b/i },
]

export const inferAuroraScene = (text: string): AuroraScene | null => {
  const compact = text.trim().slice(0, 2000)
  if (!compact) return null
  return activityPatterns.find(({ pattern }) => pattern.test(compact))?.scene ?? null
}

export const getAuroraDaypart = (date = new Date()): AuroraDaypart => {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'day'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}
