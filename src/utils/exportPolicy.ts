const forbidden=/(password|accessToken|refreshToken|authorization|secret)/i
export const hasForbiddenExportKeys=(value:unknown):boolean=>{if(Array.isArray(value))return value.some(hasForbiddenExportKeys);if(value&&typeof value==='object')return Object.entries(value as Record<string,unknown>).some(([k,v])=>forbidden.test(k)||hasForbiddenExportKeys(v));return false}
