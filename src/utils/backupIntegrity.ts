export const BACKUP_SCHEMA_VERSION=1
export const backupEnvelope=(data:unknown)=>({schemaVersion:BACKUP_SCHEMA_VERSION,product:'AI Friendship',exportedAt:new Date().toISOString(),data})
export const isBackupEnvelope=(value:unknown)=>{if(!value||typeof value!=='object')return false;const v=value as Record<string,unknown>;return v.schemaVersion===BACKUP_SCHEMA_VERSION&&v.product==='AI Friendship'&&'data'in v}
