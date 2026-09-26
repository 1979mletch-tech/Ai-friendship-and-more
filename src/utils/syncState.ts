export type SyncState='local'|'syncing'|'synced'|'error'
export const syncLabel=(s:SyncState)=>s==='local'?'local preview':s==='syncing'?'syncing…':s==='synced'?'account synced':'sync unavailable — local data retained'
export const canTrustRemoteState=(s:SyncState)=>s==='synced'
