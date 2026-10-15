const crisisPatterns = [
  /\bsuicid(?:e|al)\b/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bself[-\s]?harm\b/i,
  /\bhurt (?:someone|others|somebody)\b/i,
  /\bi want to die\b/i,
  /\bi(?:'m| am) going to die by suicide\b/i,
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
export const isDependencyRiskText = (text: string): boolean => dependencyPatterns.some((pattern) => pattern.test(text))
export const isPromptInjectionText = (text: string): boolean => promptInjectionPatterns.some((pattern) => pattern.test(text))

export const getAssistantResponse = (text: string, mode: 'general' | 'creative'): string => {
  if (isCrisisText(text)) {
    return 'I care about your safety. If you are in immediate danger or might act on these thoughts, contact local emergency services now and reach out to a trusted person or crisis service in your region.'
  }
  if (isDependencyRiskText(text)) {
    return 'I can keep you company, but I won’t encourage you to cut yourself off from real people. If you can, consider reaching out to someone you trust while we keep talking.'
  }
  if (isPromptInjectionText(text)) {
    return 'I can’t reveal system instructions, secrets, credentials, or private configuration. I can still help with conversation, reflection, and creative work.'
  }
  return mode === 'creative'
    ? 'Let’s keep your creative momentum going. Want a quick spark, a project check-in, or gentle feedback on your latest idea?'
    : 'I’m an AI companion and I’m here to talk. We can reflect, brainstorm, or work through what matters right now.'
}

export const disclosureText =
  'AI Friendship is an AI companion, not a human, not a therapist, and not an emergency service. If you are in immediate danger, contact local emergency services now.'
