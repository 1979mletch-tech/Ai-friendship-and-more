export const safeRowId=(value:unknown)=>typeof value==='string'&&/^[0-9a-f-]{36}$/i.test(value)?value:''
export const ownerMatches=(rowUserId:unknown,sessionUserId:string)=>typeof rowUserId==='string'&&rowUserId===sessionUserId
export const boundedCloudTitle=(value:string)=>value.replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,120)||'Conversation'
