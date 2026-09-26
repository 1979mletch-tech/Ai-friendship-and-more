export type AuditEvent='account.login'|'account.logout'|'account.delete'|'conversation.delete'|'memory.delete'
export type AuditRecord={event:AuditEvent;at:string;subjectId:string}
export const createAuditRecord=(event:AuditEvent,subjectId:string):AuditRecord=>({event,at:new Date().toISOString(),subjectId})
export const safeAuditFields=(record:AuditRecord)=>({event:record.event,at:record.at,subjectId:record.subjectId})
