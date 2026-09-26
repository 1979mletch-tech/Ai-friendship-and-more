export const normalizeMessage = (value:string) => value.replace(/\s+/g,' ').trim().slice(0,2000)
export const canSendMessage = (value:string, consent:boolean, sending:boolean, used:number, limit:number) =>
  Boolean(normalizeMessage(value)) && consent && !sending && used < limit
export const transcriptWindow = <T>(items:T[], limit=24) => items.slice(-Math.max(1,limit))
