export const MINIMUM_USER_AGE=18
export const AURORA_PRESENTATION_AGE='25+'
export type AgeEligibility='eligible'|'underage'|'unknown'
export const ageEligibility=(age:number|null):AgeEligibility=>age==null||!Number.isFinite(age)?'unknown':age>=MINIMUM_USER_AGE?'eligible':'underage'
export const mayUseInteractiveAurora=(confirmedAdult:boolean)=>confirmedAdult
export const adultGateCopy=`AI Aurora's interactive companion is for adults aged ${MINIMUM_USER_AGE}+ only.`
