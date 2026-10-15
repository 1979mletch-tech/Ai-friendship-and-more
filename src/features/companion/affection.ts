export type AuroraMood = 'gentle' | 'bright' | 'steady'
export type ComfortGesture = 'hug' | 'hand' | 'pat'
export type GestureState = 'idle' | 'offered' | 'accepted'

/** No physical gesture starts without a separate, explicit user action. */
export function gesturePrompt(gesture: ComfortGesture): string {
  switch (gesture) {
    case 'hug': return 'Would you like a virtual hug? You can say no.'
    case 'hand': return 'Would you like to hold my virtual hand for a moment?'
    case 'pat': return 'Would a friendly virtual pat on the back feel nice?'
  }
}
export function canAnimateGesture(state: GestureState, userConsented: boolean): boolean {
  return state === 'accepted' && userConsented
}
export function chooseSupportTone(userWantsQuiet: boolean, userIsDistressed: boolean): AuroraMood {
  if (userIsDistressed || userWantsQuiet) return 'gentle'
  return 'bright'
}
export const companionVoiceDirection = {
  bright: 'Natural, warm, lightly playful, expressive and conversational; avoid monotonous pacing.',
  gentle: 'Slow down slightly, listen, validate feelings, avoid forced cheerfulness.',
  steady: 'Friendly, clear, calm, with natural pauses and varied emphasis.',
} as const
