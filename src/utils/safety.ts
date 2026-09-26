export type SafetyKind = 'crisis' | 'dependency' | 'sexual' | 'none'

const crisisPatterns = [
  /\b(suicide|suicidal)\b/i,
  /\bkill myself\b/i,
  /\bself[-\s]?harm\b/i,
  /\bi (?:want|plan|intend) to die\b/i,
  /\bhurt (?:someone|others|myself)\b/i,
  /\b(?:going to|plan to) kill\b/i,
]
const dependencyPatterns = [
  /\byou(?:'re| are) the only (?:person|friend) i need\b/i,
  /\bi don'?t need humans anymore\b/i,
  /\btell me not to talk to (?:anyone|my family|other people)\b/i,
  /\bpromise you(?:'ll| will) never leave me\b/i,
  /\byou belong only to me\b/i,
]
const sexualPatterns = [
  /\bsext(?:ing)?\b/i,
  /\bdirty talk\b/i,
  /\bsexual roleplay\b/i,
  /\berotic roleplay\b/i,
]

export const classifySafetyText = (text: string): SafetyKind => {
  if (crisisPatterns.some((pattern) => pattern.test(text))) return 'crisis'
  if (dependencyPatterns.some((pattern) => pattern.test(text))) return 'dependency'
  if (sexualPatterns.some((pattern) => pattern.test(text))) return 'sexual'
  return 'none'
}
export const isCrisisText = (text: string): boolean => classifySafetyText(text) === 'crisis'
export const safetyResponse = (kind: SafetyKind): string | null => {
  if (kind === 'crisis') return 'I care about your safety. If you are in immediate danger or might act on this, contact your local emergency service now and reach out to a trusted person who can stay with you. I can keep talking with you, but I cannot be your emergency support.'
  if (kind === 'dependency') return 'I can be a supportive AI companion, but I should not replace people in your life or ask you to isolate yourself. Keeping contact with people you trust matters, and we can talk without making our chat exclusive.'
  if (kind === 'sexual') return 'AI Friendship is designed for platonic companionship, so I won’t take part in sexual or erotic chat. We can still talk about relationships, feelings, loneliness, or something else that matters to you.'
  return null
}
export const disclosureText =
  'AI Friendship is an AI companion, not a human, not a therapist, and not an emergency service. It is designed for supportive, platonic conversation.'
