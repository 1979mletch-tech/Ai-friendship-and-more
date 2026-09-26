const banned=[/human replacement/i,/always understands you/i,/never leaves you/i,/therapist replacement/i,/guaranteed private/i]
export const marketingCopyIsSafe=(value:string)=>!banned.some(pattern=>pattern.test(value))
export const marketingSafetyIssues=(value:string)=>banned.filter(pattern=>pattern.test(value)).map(pattern=>pattern.source)
