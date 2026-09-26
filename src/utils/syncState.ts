export type SyncState='local'|'syncing'|'synced'|'partial'|'error'
export const syncLabel=(s:SyncState)=>s==='local'?'local preview':s==='syncing'?'syncing…':s==='synced'?'account synced':s==='partial'?'account partly synced — some local data retained':'sync unavailable — local data retained'
export const canTrustRemoteState=(s:SyncState)=>s==='synced'
