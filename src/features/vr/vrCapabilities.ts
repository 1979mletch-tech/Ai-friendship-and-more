export type VrCapabilities = { secure: boolean; immersive: boolean; handTrackingRequestable: boolean }

export async function getVrCapabilities(): Promise<VrCapabilities> {
  if (typeof navigator === 'undefined') return { secure: false, immersive: false, handTrackingRequestable: false }
  const secure = typeof window !== 'undefined' && window.isSecureContext
  const xr = (navigator as Navigator & { xr?: { isSessionSupported(mode: string): Promise<boolean> } }).xr
  if (!secure || !xr) return { secure, immersive: false, handTrackingRequestable: false }
  try {
    const immersive = await xr.isSessionSupported('immersive-vr')
    // WebXR cannot reliably preflight optional hand-tracking support. This flag
    // only means we can request it when starting an immersive session.
    return { secure, immersive, handTrackingRequestable: immersive }
  } catch {
    return { secure, immersive: false, handTrackingRequestable: false }
  }
}
