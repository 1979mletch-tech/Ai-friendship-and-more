export type AgeAssuranceState='not-checked'|'adult-confirmed'|'not-eligible'|'verification-required'
export const canCreateAccount=(state:AgeAssuranceState)=>state==='adult-confirmed'
export const canStartChat=(state:AgeAssuranceState)=>state==='adult-confirmed'
export const shouldStoreFullDateOfBirth=()=>false
