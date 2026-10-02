export type AuroraReaction = 'neutral' | 'warm' | 'amused' | 'celebrate' | 'encourage' | 'calm' | 'focus' | 'concerned'

const cues: Array<{ reaction: Exclude<AuroraReaction, 'neutral'>; pattern: RegExp }> = [
  { reaction: 'celebrate', pattern: /\b(i did it|we did it|finished it|got the job|passed|great news|good news|worked!|it worked|proud of|won|success)\b/i },
  { reaction: 'concerned', pattern: /\b(worried|scared|upset|awful|terrible|hurt|lonely|bad news|anxious)\b/i },
  { reaction: 'encourage', pattern: /\b(stuck|struggling|frustrated|didn't work|did not work|failed|hard day|rough day|can't get|cannot get|need a push)\b/i },
  { reaction: 'calm', pattern: /\b(relax|unwind|wind down|bedtime|going to bed|sleep|quiet time|take it easy|slow down)\b/i },
  { reaction: 'focus', pattern: /\b(focus|plan|project|deadline|next step|to-do|todo|work session|study|brainstorm)\b/i },
  { reaction: 'amused', pattern: /\b(lol|haha|funny|hilarious|joke|made me laugh|😂|🤣)\b/i },
  { reaction: 'warm', pattern: /\b(thank you|thanks|lovely|nice to see you|good morning|good evening|hello aurora|hi aurora)\b/i },
]

export const inferAuroraReaction = (text: string): AuroraReaction => {
  const bounded = text.trim().slice(0, 2500)
  if (!bounded) return 'neutral'
  return cues.find(({ pattern }) => pattern.test(bounded))?.reaction ?? 'neutral'
}
