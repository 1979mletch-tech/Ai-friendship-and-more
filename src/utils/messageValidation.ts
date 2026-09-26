export const MAX_MESSAGE_LENGTH=4000
export const validateMessage=(value:string):string|null=>{const t=value.trim();if(!t)return'Write a message first.';if(t.length>MAX_MESSAGE_LENGTH)return`Keep messages under ${MAX_MESSAGE_LENGTH} characters.`;return null}
