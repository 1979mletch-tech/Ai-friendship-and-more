import type{Session}from'../services/apiClient'
export const validSessionShape=(value:unknown):value is Session=>{if(!value||typeof value!=='object')return false;const x=value as Partial<Session>;return Boolean(x.accessToken&&typeof x.accessToken==='string'&&x.user&&typeof x.user.id==='string'&&x.user.id&&typeof x.user.email==='string'&&x.user.email)}
export const sessionStorageValue=(value:unknown):Session|null=>validSessionShape(value)?value:null
