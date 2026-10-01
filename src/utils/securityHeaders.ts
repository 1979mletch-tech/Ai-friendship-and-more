export const recommendedSecurityHeaders=()=>({
'X-Content-Type-Options':'nosniff',
'Referrer-Policy':'strict-origin-when-cross-origin',
'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
'Cross-Origin-Opener-Policy':'same-origin'
})
export const headerNames=()=>Object.keys(recommendedSecurityHeaders())
