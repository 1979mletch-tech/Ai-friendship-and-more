import type{LocalConversation}from'./chatPersistence'
export const retentionSummary=(items:LocalConversation[],days:number,now=new Date())=>{const cutoff=now.getTime()-days*86400000;const expired=items.filter(x=>Date.parse(x.updatedAt)<cutoff).length;return{days,total:items.length,expired}}
