import type{LocalConversation}from'./chatPersistence'
export const hasConversation=(items:LocalConversation[],id:string)=>items.some(x=>x.id===id)
export const nextConversationId=(items:LocalConversation[],removedId:string,currentId:string)=>currentId!==removedId?currentId:(items.find(x=>x.id!==removedId)?.id??'default')
export const replaceConversation=(items:LocalConversation[],next:LocalConversation,previousId=next.id)=>[next,...items.filter(x=>x.id!==previousId&&x.id!==next.id)]
