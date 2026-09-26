export const normalizeEmailAddress=(value:string)=>value.trim().toLowerCase().slice(0,254)
export const validEmailAddress=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmailAddress(value))
export const passwordLengthOk=(value:string)=>value.length>=8&&value.length<=128
