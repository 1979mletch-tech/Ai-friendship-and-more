export const stagingBanner=(hostname:string)=>hostname.includes('github.io')||hostname.includes('localhost')?'TEST ENVIRONMENT · Do not use real sensitive personal data.':''
export const isPreviewHost=(hostname:string)=>Boolean(stagingBanner(hostname))
