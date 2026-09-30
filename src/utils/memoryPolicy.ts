export const memoryAllowed=(enabled:boolean,value:string)=>enabled&&Boolean(value.trim())
export const normalizeMemory=(value:string)=>value.replace(/\s+/g,' ').trim().slice(0,500)
export const memoryKey=(value:string)=>normalizeMemory(value).toLocaleLowerCase()
export const dedupeMemory=(values:string[],limit=50)=>{const map=new Map<string,string>();for(const raw of values){const v=normalizeMemory(raw);if(v)map.set(memoryKey(v),v)}return [...map.values()].slice(-limit)}
