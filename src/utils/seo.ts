import{PRODUCT_DESCRIPTION,PRODUCT_NAME}from'./brand'
export const canonicalPath=(path:string)=>path.startsWith('/')?path:`/${path}`
export const seoMetadata=(path='/')=>({title:path==='/'?`${PRODUCT_NAME} — Conversation. Creativity. Connection.`:`${PRODUCT_NAME} · ${path.replace(/^\//,'')}`,description:PRODUCT_DESCRIPTION,path:canonicalPath(path)})
