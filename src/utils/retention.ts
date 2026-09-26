export type RetentionPolicy={conversationDays:number;deletedAccountGraceDays:number}
export const DEFAULT_RETENTION:RetentionPolicy={conversationDays:365,deletedAccountGraceDays:0}
export const expiresAt=(iso:string,days:number)=>new Date(new Date(iso).getTime()+days*86400000).toISOString()
