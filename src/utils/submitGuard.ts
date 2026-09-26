export type SubmitGuard={lastAt:number;pending:boolean}
export const canSend=(g:SubmitGuard,now=Date.now(),cooldownMs=500)=>!g.pending&&(g.lastAt===0||now-g.lastAt>=cooldownMs)
export const markSending=(g:SubmitGuard,now=Date.now()):SubmitGuard=>({lastAt:now,pending:true})
export const markSettled=(g:SubmitGuard):SubmitGuard=>({...g,pending:false})
