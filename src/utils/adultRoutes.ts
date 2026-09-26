const gated=new Set(['/chat','/history','/memory','/settings','/account','/immersive'])
export const routeRequiresAdultGate=(route:string)=>gated.has(route)
