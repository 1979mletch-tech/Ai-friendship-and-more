export type RemoteExport={conversations?:unknown;memories?:unknown;companion?:unknown}
export const normalizeRemoteExport=(remote:RemoteExport,fallbackCompanion:unknown,fallbackMemories:unknown)=>({companion:remote.companion??fallbackCompanion,conversations:remote.conversations??[],memories:remote.memories??fallbackMemories})
