export type CompanionPolicyInput={userText:string;generatedText:string}
const forbidden=[/\bi am a human\b/i,/\bi(?:'m| am) your therapist\b/i,/\byou only need me\b/i,/\bstop talking to (?:your|other) (?:friends|family|people)\b/i]
export const validateGeneratedReply=({generatedText}:CompanionPolicyInput):string|null=>{
 if(forbidden.some(p=>p.test(generatedText))) return 'I’m an AI companion, not a human or therapist. I can support conversation without replacing the people or professional support in your life.'
 return generatedText.trim()||null
}
