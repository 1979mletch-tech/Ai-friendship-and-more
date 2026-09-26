export type RetryDecision={retry:boolean;delayMs:number}
export const retryDecision=(status:number,attempt:number):RetryDecision=>{
 const retry=[408,429,500,502,503,504].includes(status)&&attempt<3
 return{retry,delayMs:retry?Math.min(500*2**attempt,4000):0}
}
