export type ServiceHealth='online'|'offline'|'unknown'
export const serviceHealth=(online:boolean|undefined):ServiceHealth=>online===true?'online':online===false?'offline':'unknown'
export const serviceHealthLabel=(s:ServiceHealth)=>s==='online'?'Online':s==='offline'?'Offline — local features remain available':'Connection status unknown'
