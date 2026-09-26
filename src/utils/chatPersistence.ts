export type ChatMessage={id:string;role:'user'|'assistant';text:string;createdAt:string;dayKey?:string}
export type LocalConversation={id:string;title:string;createdAt:string;updatedAt:string;messages:ChatMessage[]}
export const newLocalConversation=(id=crypto.randomUUID()):LocalConversation=>({id,title:'New conversation',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),messages:[]})
export const appendExchange=(c:LocalConversation,userText:string,assistantText:string,now=new Date()):LocalConversation=>{
 const createdAt=now.toISOString(); const dayKey=createdAt.slice(0,10)
 const title=c.title==='New conversation'?(userText.trim().slice(0,48)||'Conversation'):c.title
 return {...c,title,updatedAt:createdAt,messages:[...c.messages,{id:crypto.randomUUID(),role:'user',text:userText,createdAt,dayKey},{id:crypto.randomUUID(),role:'assistant',text:assistantText,createdAt,dayKey}]}
}
export const selectConversation=(items:LocalConversation[],id:string)=>items.find(x=>x.id===id)
