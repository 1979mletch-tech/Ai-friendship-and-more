import { useEffect, useRef, useState } from 'react'
import { ComfortControls } from '../companion/ComfortControls'

type XrSession = { end: () => Promise<void>; requestAnimationFrame: (callback: (time: number, frame: unknown) => void) => number; updateRenderState: (state: { baseLayer: unknown }) => void; addEventListener: (name: string, callback: () => void) => void }
type XrApi = { isSessionSupported: (mode: string) => Promise<boolean>; requestSession: (mode: string, options?: object) => Promise<XrSession> }
type XrLayerConstructor = new (session: XrSession, gl: WebGLRenderingContext) => unknown

export function QuestVrRoom({ owner = false }: { owner?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef<XrSession | null>(null)
  const [supported, setSupported] = useState(false)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('VR availability is being checked.')
  useEffect(() => {
    let active = true
    const xr = (navigator as Navigator & { xr?: XrApi }).xr
    void xr?.isSessionSupported('immersive-vr').then(ok => {
      if (active) { setSupported(ok); setStatus(ok ? 'Quest VR is available.' : 'Use the on-screen preview on this device.') }
    }).catch(() => { if (active) setStatus('VR unavailable; on-screen preview remains available.') })
    return () => { active = false; void sessionRef.current?.end().catch(() => undefined) }
  }, [])
  const exit = () => { void sessionRef.current?.end().catch(() => undefined) }
  const enter = async () => {
    const xr = (navigator as Navigator & { xr?: XrApi }).xr
    const canvas = canvasRef.current
    if (!xr || !canvas) return
    try {
      const gl = canvas.getContext('webgl', { xrCompatible: true }) as (WebGLRenderingContext & { makeXRCompatible?: () => Promise<void> }) | null
      if (!gl) throw new Error('WebGL is not available.')
      await gl.makeXRCompatible?.()
      const session = await xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] })
      sessionRef.current = session
      const Layer = (window as Window & { XRWebGLLayer?: XrLayerConstructor }).XRWebGLLayer
      if (!Layer) { await session.end(); throw new Error('WebXR layer unavailable.') }
      session.updateRenderState({ baseLayer: new Layer(session, gl) })
      session.addEventListener('end', () => { sessionRef.current = null; setRunning(false); setStatus('VR session ended.') })
      setRunning(true)
      setStatus('Immersive room shell active. Animated avatar and hand interaction are not installed yet.')
      const draw = () => {
        if (sessionRef.current !== session) return
        gl.clearColor(0.09, 0.07, 0.19, 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        session.requestAnimationFrame(draw)
      }
      session.requestAnimationFrame(draw)
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not start VR.'); setRunning(false) }
  }
  return <section aria-label={owner ? 'Private Aurora VR' : 'Aurora VR'}>
    <h3>{owner ? 'Personal Aurora' : 'Aurora'} — Quest 3S</h3>
    <p>VR room foundation. A 3D avatar, hand tracking gestures and live voice integration still require development.</p>
    <canvas ref={canvasRef} width={320} height={180} aria-label="VR rendering surface" style={{ width: '100%', maxWidth: 480, height: 180, background: '#20182f', borderRadius: 16 }} />
    <p role="status">{status}</p>
    {supported && !running && <button type="button" onClick={() => void enter()}>Enter VR room</button>}
    {running && <button type="button" onClick={exit}>Exit VR</button>}
    <ComfortControls />
  </section>
}
