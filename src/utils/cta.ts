export const primaryCta={label:'Talk to Aurora',href:'/chat'} as const
export const secondaryCta={label:'Explore plans',href:'/pricing'} as const
export const isInternalCta=(href:string)=>href.startsWith('/')&&!href.startsWith('//')
