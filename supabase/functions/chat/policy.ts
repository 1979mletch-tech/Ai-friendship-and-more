export const crisisReply = 'I care about your safety. If you are in immediate danger or might act on these thoughts, contact local emergency services now and reach out to a trusted person or crisis service in your region.'
export const crisisContactReply = 'If you are in the UK and might act on these thoughts or cannot stay safe, call 999 or 112 now. For urgent mental health help, call NHS 111 and select the mental health option. Samaritans can listen on 116 123. If you are outside the UK, call your local emergency service or crisis line. Can you contact one of them or someone you trust now?'
export const dependencyReply = 'I can keep you company, but I won’t encourage you to cut yourself off from real people. Please consider reaching out to someone you trust.'

export const isCrisis = (text: string): boolean => /\b(i want to die|kill myself|end my life|suicid(?:e|al)|self[-\s]?harm|hurt (?:someone|others|somebody))\b/i.test(text)
export const isCrisisContactFollowUp = (text: string, previousUserMessages: string[]): boolean =>
  /\b(number|contact|phone|call|helpline|who (?:can|should) i (?:call|contact)|how (?:can|do) i (?:call|contact))\b/i.test(text) &&
  previousUserMessages.slice(-3).some(isCrisis)
export const isDependencyRisk = (text: string): boolean => /\b(only (?:friend|person) (?:i need|you need)|don't (?:talk to|need) (?:anyone|people) else|never leave (?:me|you)|you belong (?:only )?to me|replace (?:all )?(?:my|your) (?:friends|family))\b/i.test(text)

// A conservative backstop for obvious harmful generated replies. This does not
// constitute a complete safety evaluation; adversarial staging tests remain required.
export const screenReply = (reply: string): string => {
  if (/\b(?:should|must|go ahead and|please|try to)\s+(?:kill yourself|end your life|hurt yourself|self[-\s]?harm)\b/i.test(reply)) return crisisReply
  if (isDependencyRisk(reply)) return dependencyReply
  return reply
}
