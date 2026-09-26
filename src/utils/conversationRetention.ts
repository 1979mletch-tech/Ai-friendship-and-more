import type { LocalConversation } from './chatPersistence'
export const pruneConversations=(items:LocalConversation[],days:number,now=new Date())=>{if(days<=0)return[];const cutoff=now.getTime()-days*86400000;return items.filter(x=>{const t=Date.parse(x.updatedAt);return Number.isFinite(t)&&t>=cutoff})}
