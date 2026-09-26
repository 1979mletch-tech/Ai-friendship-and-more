export type RequestState<T>={status:'idle'|'loading'|'success'|'error';data?:T;error?:string}
export const idle=<T>():RequestState<T>=>({status:'idle'})
export const loading=<T>():RequestState<T>=>({status:'loading'})
export const success=<T>(data:T):RequestState<T>=>({status:'success',data})
export const failure=<T>(error:string):RequestState<T>=>({status:'error',error})
export const canSubmit=(state:RequestState<unknown>)=>state.status!=='loading'
