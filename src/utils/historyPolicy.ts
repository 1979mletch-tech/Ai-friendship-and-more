export const historyCutoff = (days:number, now=Date.now()) => now-Math.max(1,days)*86400000
export const withinHistoryPlan = (timestamp:string|undefined, days:number, now=Date.now()) => !timestamp || Date.parse(timestamp)>=historyCutoff(days,now)
export const filterHistoryByPlan = <T extends {createdAt?:string}>(items:T[],days:number,now=Date.now()) => items.filter(x=>withinHistoryPlan(x.createdAt,days,now))
