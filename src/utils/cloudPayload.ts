export const boundedMessages=(messages:Array<{role:'user'|'assistant';text:string}>)=>messages.slice(-24).map(m=>({role:m.role,text:m.text.trim().slice(0,2000)})).filter(m=>m.text)
export const boundedCompanionName=(value:string)=>value.replace(/[<>]/g,'').trim().slice(0,32)||'Friend'
export const chatPayload=(messages:Array<{role:'user'|'assistant';text:string}>,mode:string,name:string)=>({messages:boundedMessages(messages),mode:mode==='creative'?'creative':'general',companionName:boundedCompanionName(name)})
