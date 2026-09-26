import{shouldRetry,retryDelayMs}from'../utils/retryPolicy'
export const fetchWithRetry=async(input:RequestInfo|URL,init?:RequestInit,maxAttempts=3):Promise<Response>=>{
 let last:Response|undefined
 for(let attempt=0;attempt<maxAttempts;attempt++){try{const r=await fetch(input,init);last=r;if(!shouldRetry(r.status)||attempt===maxAttempts-1)return r;await new Promise(res=>setTimeout(res,retryDelayMs(attempt)))}catch(e){if(attempt===maxAttempts-1)throw e;await new Promise(res=>setTimeout(res,retryDelayMs(attempt)))}}return last as Response
}
