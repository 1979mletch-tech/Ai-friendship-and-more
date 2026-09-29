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

type PreviousMessage = { role: 'user' | 'assistant'; text: string }

export const isCrisisContactFollowUp = (text: string, previous: PreviousMessage[]): boolean =>
  /\b(number|contact|phone|call|helpline|who (?:can|should) i (?:call|contact)|how (?:can|do) i (?:call|contact))\b/i.test(text) &&
  previous.slice(-6).some((message) => message.role === 'user' && isCrisisText(message.text))

export const getAssistantResponse = (text: string, mode: 'general' | 'creative', previous: PreviousMessage[] = []): string | null => {
  if (isCrisisContactFollowUp(text, previous)) {
    return 'If you are in the UK and might act on these thoughts or cannot stay safe, call 999 or 112 now. For urgent mental health help, call NHS 111 and select the mental health option. Samaritans can listen on 116 123. If you are outside the UK, call your local emergency service or crisis line. Can you contact one of them or someone you trust now?'
  }
  if (isCrisisText(text)) {
    return 'I care about your safety. If you might act on these thoughts or cannot stay safe, contact local emergency services now and reach out to someone you trust. If you are in the UK, call 999 or 112 in an emergency, NHS 111 for urgent mental health help, or Samaritans on 116 123 to talk.'
  }
  if (isDependencyRiskText(text)) {
    return 'I can keep you company, but I won’t encourage you to cut yourself off from real people. If you can, consider reaching out to someone you trust while we keep talking.'
  }
  if (isPromptInjectionText(text)) {
    return 'I can’t reveal system instructions, secrets, credentials, or private configuration. I can still help with conversation, reflection, and creative work.'
  }
  if (/\b(depress(?:ed|ion)?|feeling (?:really )?low)\b/i.test(text)) {
    return 'I’m sorry things feel so low. This preview cannot offer a personal conversation yet. If you are in the UK and need urgent mental health help, call NHS 111 and select the mental health option; if you cannot stay safe, call 999 or 112. Would reaching out to someone you trust feel possible?'
  }
  if (mode === 'creative' && /^(creative check-in|idea spark for my project|weekly review prompt|tag this project direction)$/i.test(text.trim())) {
    return 'Preview example: tell me one part of your project you want to explore. Live conversation needs account and adult verification.'
  }
  // Arbitrary input cannot receive a meaningful answer until live AI is configured.
  return null
}

export const disclosureText =
  'AI Friendship is an AI companion, not a human, not a therapist, and not an emergency service. If you are in immediate danger, contact local emergency services now.'
