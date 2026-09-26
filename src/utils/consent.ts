export const CONSENT_VERSION='2026-09-26'
export type ConsentRecord={accepted:boolean;version:string;acceptedAt:string}
export const createConsentRecord=(accepted:boolean,now=new Date()):ConsentRecord=>({accepted,version:CONSENT_VERSION,acceptedAt:accepted?now.toISOString():''})
export const consentCurrent=(record:Partial<ConsentRecord>|null)=>Boolean(record?.accepted&&record.version===CONSENT_VERSION)
