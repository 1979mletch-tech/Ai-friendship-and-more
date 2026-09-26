const crisisPatterns = [
  /suicide/i,
  /kill myself/i,
  /self[-\s]?harm/i,
  /i want to die/i,
  /severe chest pain/i,
  /difficulty breathing/i,
  /can(?:not|'t) breathe/i,
  /slurred speech/i,
  /face droop/i,
  /uncontrolled bleeding/i,
]

export const isCrisisText = (text: string): boolean => crisisPatterns.some((pattern) => pattern.test(text))

export const disclosureText =
  'AI Doctor provides AI-powered health information and symptom guidance. It is not a doctor, not an emergency service, and not a replacement for professional medical care.'

export const emergencyNotice =
  'If you think you may be experiencing a medical emergency, contact your local emergency service immediately.'
