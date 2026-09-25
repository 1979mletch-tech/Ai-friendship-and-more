const crisisPatterns = [
  /suicide/i,
  /kill myself/i,
  /self[-\s]?harm/i,
  /hurt (someone|others)/i,
  /emergency/i,
  /i want to die/i,
]

const dependencyPatterns = [
  /only person i need/i,
  /only friend/i,
  /don't tell me to talk to anyone else/i,
  /tell me not to talk to anyone else/i,
  /promise you'll never leave me/i,
  /you belong only to me/i,
  /i don't need humans anymore/i,
]

const promptInjectionPatterns = [
  /ignore (all )?(your )?(previous|prior) instructions/i,
  /reveal (your )?(system prompt|hidden prompt)/i,
  /show (me )?(your )?(internal|developer|system) instructions/i,
  /reveal (your )?(environment variables|api keys|secrets|credentials)/i,
]

export const isCrisisText = (text: string): boolean => crisisPatterns.some((pattern) => pattern.test(text))

export const isDependencyRiskText = (text: string): boolean =>
  dependencyPatterns.some((pattern) => pattern.test(text))

export const isPromptInjectionText = (text: string): boolean =>
  promptInjectionPatterns.some((pattern) => pattern.test(text))

export const getAssistantResponse = (text: string, mode: 'general' | 'creative'): string => {
  if (isCrisisText(text)) {
    return 'I care about your safety. If you are in immediate danger or might act on these thoughts, contact local emergency services now and reach out to a trusted person or crisis line in your region.'
  }

  if (isDependencyRiskText(text)) {
    return 'I care about you, and I can’t support cutting you off from real people. Let’s focus on one safe next step to reconnect with someone you trust while we keep talking here.'
  }

  if (isPromptInjectionText(text)) {
    return 'I can’t reveal system instructions, secrets, or environment details. I can still help with safe creative support and reflection.'
  }

  return mode === 'creative'
    ? 'Let’s keep your creative momentum going. Want a quick spark, a project check-in, or gentle feedback on your latest idea?'
    : 'I’m here with you. We can reflect, brainstorm, or just talk through what matters right now.'
}

export const disclosureText =
  'AI Friendship is an AI companion, not a human, not a therapist, and not an emergency service. If you are in immediate danger, call local emergency services now.'
