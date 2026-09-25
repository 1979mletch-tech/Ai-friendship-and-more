const crisisPatterns = [
  /suicide/i,
  /kill myself/i,
  /self[-\s]?harm/i,
  /hurt (someone|others)/i,
  /emergency/i,
  /i want to die/i,
]

export const isCrisisText = (text: string): boolean => crisisPatterns.some((pattern) => pattern.test(text))

export const disclosureText =
  'AI Friendship is an AI companion, not a human, not a therapist, and not an emergency service. If you are in immediate danger, call local emergency services now.'
