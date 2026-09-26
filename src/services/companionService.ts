import { classifySafetyText, safetyResponse } from '../utils/safety'

export type CompanionMode = 'general' | 'creative'

const creativeReplies = [
  'Let’s make the next step small and useful. Tell me what you are making and where you feel stuck.',
  'I’m with you on the project. Give me the rough idea, even if it is messy, and we can shape it together.',
]
const generalReplies = [
  'I’m here to talk it through with you. What part feels most important right now?',
  'We can take this one piece at a time. Tell me a little more about what is on your mind.',
]

export const createCompanionReply = (text: string, mode: CompanionMode): string => {
  const safe = safetyResponse(classifySafetyText(text))
  if (safe) return safe
  const pool = mode === 'creative' ? creativeReplies : generalReplies
  return pool[text.length % pool.length]
}
