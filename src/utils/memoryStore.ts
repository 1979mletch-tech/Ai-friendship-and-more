export type MemoryItem={id:string;label:string;value:string;createdAt:string}
export const sanitizeMemory=(label:string,value:string):MemoryItem=>({id:crypto.randomUUID(),label:label.trim().slice(0,60),value:value.trim().slice(0,500),createdAt:new Date().toISOString()})
export const removeMemory=(items:MemoryItem[],id:string)=>items.filter(x=>x.id!==id)
