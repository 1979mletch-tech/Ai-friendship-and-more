import { chooseSupportTone, type AuroraMood } from './affection'

export type VoiceStyle = {
  mode: AuroraMood
  rate: number
  pitch: number
  description: string
}
const styles: Record<AuroraMood, Omit<VoiceStyle, 'mode'>> = {
  bright: { rate: 1.05, pitch: 1.04, description: 'Warm, expressive, playful, never exaggerated.' },
  gentle: { rate: 0.93, pitch: 1, description: 'Patient, calm, sensitive and not falsely cheerful.' },
  steady: { rate: 1, pitch: 1, description: 'Natural and friendly with comfortable pauses.' },
}
export function getVoiceStyle(userWantsQuiet: boolean, distressDetected: boolean): VoiceStyle {
  const mode = chooseSupportTone(userWantsQuiet, distressDetected)
  return { mode, ...styles[mode] }
}
export function isDistressCue(text: string): boolean {
  return /\b(depressed|hopeless|grieving|bereaved|lonely|anxious|scared|upset|crying)\b/i.test(text)
}
