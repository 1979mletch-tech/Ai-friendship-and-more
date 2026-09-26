const sensitiveKeys=/(password|token|secret|message|memory|note|authorization)/i
export const redactDiagnosticFields=(fields:Record<string,unknown>)=>Object.fromEntries(Object.entries(fields).filter(([k])=>!sensitiveKeys.test(k)))
