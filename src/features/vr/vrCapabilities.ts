export type VrCapabilities = { secure: boolean; immersive: boolean; handTrackingRequested: boolean }
export async function getVrCapabilities(): Promise<VrCapabilities> {
  if (typeof navigator === 'undefined') return { secure: false, immersive: false, handTrackingRequested: false }
  const secure = typeof window !== 'undefined' && window.isSecureContext
  const xr = (navigator as Navigator & { xr?: { isSessionSupported(mode: string): Promise<boolean> } }).xr
  if (!secure || !xr) return { secure, immersive: false, handTrackingRequested: false }
  try {
    const immersive = await xr.isSessionSupported('immersive-vr')
    return { secure, immersive, handTrackingRequested: immersive }
  } catch {
    return { secure, immersive: false, handTrackingRequested: false }
  }
}
