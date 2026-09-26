export const shouldSendOnKey=(key:string,shiftKey:boolean,composing=false)=>key==='Enter'&&!shiftKey&&!composing
export const escapeClearsDraft=(key:string)=>key==='Escape'
