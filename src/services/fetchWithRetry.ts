import{retryDecision}from'../utils/retryPolicy'
export const fetchWithRetry=async(input:RequestInfo|URL,init?:RequestInit,maxAttempts=3):Promise<Response>=>{
 let last:Response|undefined
 for(let attempt=0;attempt<maxAttempts;attempt++){try{const r=await fetch(input,init);last=r;const d=retryDecision(r.status,attempt);if(!d.retry||attempt===maxAttempts-1)return r;await new Promise(res=>setTimeout(res,d.delayMs))}catch(e){if(attempt===maxAttempts-1)throw e;const d=retryDecision(503,attempt);await new Promise(res=>setTimeout(res,d.delayMs))}}return last as Response
}
