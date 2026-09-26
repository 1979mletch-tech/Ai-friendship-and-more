import type{PlanId}from'../types/subscription';import type{BillingStatus}from'../services/billingApi'
export const trustedPlan=(serverMode:boolean,status:BillingStatus|undefined,local:PlanId):PlanId=>serverMode?(status?.status==='active'?status.planId:'free'):local
