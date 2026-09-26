import type{Session}from'./apiClient';import{conversationApi}from'./conversationApi';import{classifySafetyText,safetyResponse}from'../utils/safety'
export type ServerReplyInput={session:Session;conversationId:string;text:string;mode:'general'|'creative'}
export const getSafeServerReply=async(input:ServerReplyInput):Promise<string>=>{const safety=safetyResponse(classifySafetyText(input.text));if(safety)return safety;return(await conversationApi.append(input.session,input.conversationId,input.text,input.mode)).reply}
