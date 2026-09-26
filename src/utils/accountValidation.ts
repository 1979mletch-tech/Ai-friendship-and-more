export const normalizeEmail=(value:string)=>value.trim().toLowerCase()
export const isPlausibleEmail=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value))
export const passwordIssue=(value:string):string|null=>{
 if(value.length<10)return 'Use at least 10 characters.'
 if(!/[A-Za-z]/.test(value)||!/\d/.test(value))return 'Use at least one letter and one number.'
 return null
}
