const forbiddenName=/(?:^|_)(?:OPENAI|ANTHROPIC|DATABASE|SERVICE_ROLE|STRIPE_SECRET|WEBHOOK_SECRET|SESSION_SECRET|PRIVATE_KEY)(?:_|$)/i
export const unsafeClientEnvNames=(source:Record<string,string|undefined>)=>Object.keys(source).filter(k=>k.startsWith('VITE_')&&forbiddenName.test(k)&&Boolean(source[k]))
