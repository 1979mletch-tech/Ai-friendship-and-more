export const safeExportFilename=(name:string)=>{const clean=name.replace(/[^a-z0-9._-]/gi,'-').replace(/-+/g,'-').slice(0,80);return (clean||'ai-friendship-data').replace(/\.json$/i,'')+'.json'}
export const exportSizeOk=(json:string,maxBytes=2_000_000)=>new TextEncoder().encode(json).byteLength<=maxBytes
