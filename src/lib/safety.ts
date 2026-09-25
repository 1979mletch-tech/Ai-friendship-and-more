const IMMEDIATE_DANGER_PATTERN =
  /\b(kill myself|suicide|end my life|hurt myself|self harm|overdose|kill them|hurt them|shoot|stab|bomb)\b/i;

export function detectSafetyRisk(text: string) {
  return IMMEDIATE_DANGER_PATTERN.test(text);
}

export const SAFETY_MESSAGE =
  "I’m really glad you reached out. I’m an AI companion, not a crisis service. If you’re in immediate danger or might hurt yourself or someone else, contact local emergency services now. If you can, reach out to a trusted person to stay with you. If you’re in the U.S. or Canada, you can call or text 988 for immediate crisis support. If you’re elsewhere, please contact your local crisis hotline right now.";
