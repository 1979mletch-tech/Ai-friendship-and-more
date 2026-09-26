export const LOCAL_DATA_KEYS=['ai_friendship_messages','ai_friendship_project_notes','ai_friendship_memory','ai_friendship_companion_name'] as const
export const clearKnownLocalData=(storage:Pick<Storage,'removeItem'>)=>{for(const key of LOCAL_DATA_KEYS)storage.removeItem(key)}
