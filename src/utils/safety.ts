const crisisPatterns = [
  /suicide/i,
  /kill myself/i,
  /self[-\s]?harm/i,
  /hurt (someone|others)/i,
  /emergency/i,
  /i want to die/i,
  /suicidal/i,
  /take my own life/i,
  /can't keep myself safe/i,
  /hurt myself/i,
  /(?:end|take) my (?:own )?life/i,
  /(?:i(?:'m| am) going to|i might) (?:kill|hurt) myself/i,
  /(?:can't|cannot) keep myself safe/i,
  /(?:i(?:'ve| have) )?(?:taken|swallowed) (?:an )?overdose/i,
]

export const isCrisisText = (text: string): boolean => crisisPatterns.some((pattern) => pattern.test(text))

export const disclosureText =
  'AI Friendship is an AI companion, not a human, not a therapist, and not an emergency service. If you are in immediate danger, call local emergency services now.'

export const crisisGuidance =
  'If you may act on thoughts of harming yourself or someone else, or are in immediate danger, contact your local emergency service now. In the UK call 999 or 112. Ask someone you trust to stay with you if possible. For urgent UK mental health support when there is no immediate danger, contact NHS 111 and select the mental health option. Elsewhere, use local crisis support.'
