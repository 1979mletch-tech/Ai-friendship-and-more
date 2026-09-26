export const normalizeSearch=(value:string)=>value.replace(/\s+/g,' ').trim().toLocaleLowerCase().slice(0,120)
export const matchesSearch=(query:string,...fields:string[])=>{const q=normalizeSearch(query);return !q||fields.some(v=>v.toLocaleLowerCase().includes(q))}
