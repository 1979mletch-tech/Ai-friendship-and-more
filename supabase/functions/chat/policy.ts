export const crisisReply = 'I care about your safety. If you are in immediate danger or might act on these thoughts, contact local emergency services now and reach out to a trusted person or crisis service in your region.'
export const dependencyReply = 'I can keep you company, but I won’t encourage you to cut yourself off from real people. Please consider reaching out to someone you trust.'

export const isCrisis = (text: string): boolean => /\b(i want to die|kill myself|end my life|suicid(?:e|al)|self[-\s]?harm|hurt (?:someone|others|somebody))\b/i.test(text)
export const isDependencyRisk = (text: string): boolean => /\b(only (?:friend|person) (?:i need|you need)|don't (?:talk to|need) (?:anyone|people) else|never leave (?:me|you)|you belong (?:only )?to me|replace (?:all )?(?:my|your) (?:friends|family))\b/i.test(text)

// A conservative backstop for obvious harmful generated replies. This does not
// constitute a complete safety evaluation; adversarial staging tests remain required.
export const screenReply = (reply: string): string => {
  if (/\b(?:should|must|go ahead and|please|try to)\s+(?:kill yourself|end your life|hurt yourself|self[-\s]?harm)\b/i.test(reply)) return crisisReply
  if (isDependencyRisk(reply)) return dependencyReply
  return reply
}
