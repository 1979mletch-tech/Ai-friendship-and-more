export type UsageWindow={startedAt:number;count:number}
export const consumeUsage=(window:UsageWindow|undefined,now:number,limit:number,windowMs:number):{allowed:boolean;next:UsageWindow}=>{
 const current=!window||now-window.startedAt>=windowMs?{startedAt:now,count:0}:window
 if(current.count>=limit)return{allowed:false,next:current}
 return{allowed:true,next:{...current,count:current.count+1}}
}
