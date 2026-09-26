import { readAppEnv } from '../config/env'
import { companionApi, type Session } from './apiClient'
import { classifySafetyText, safetyResponse } from '../utils/safety'
import { validateGeneratedReply } from '../utils/outputPolicy'
import { createCompanionReply, type CompanionMode } from './companionService'

export const getCompanionReply=async(input:{text:string;mode:CompanionMode;session:Session|null;conversationId?:string})=>{
 const safety=safetyResponse(classifySafetyText(input.text)); if(safety)return safety
 const env=readAppEnv()
 if(env.authMode!=='server'||!env.apiBaseUrl||!input.session)return createCompanionReply(input.text,input.mode)
 const result=await companionApi.reply(input.session.accessToken,input.text,input.mode,input.conversationId)
 return validateGeneratedReply({userText:input.text,generatedText:result.reply})||'I could not safely generate a reply. Please try another message.'
}
