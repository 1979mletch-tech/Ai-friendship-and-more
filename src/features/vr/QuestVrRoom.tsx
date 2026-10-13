import { useEffect, useRef, useState } from 'react'
import { ComfortControls } from '../companion/ComfortControls'
import { getVrCapabilities } from './vrCapabilities'

type XrFrame = { getViewerPose: (space: unknown) => { views: unknown[] } | null }
type XrLayer = { framebuffer: WebGLFramebuffer | null; getViewport: (view: unknown) => { x: number; y: number; width: number; height: number } | null }
type XrSession = { end: () => Promise<void>; requestAnimationFrame: (callback: (time: number, frame: XrFrame) => void) => number; updateRenderState: (state: { baseLayer: XrLayer }) => void; requestReferenceSpace: (type: string) => Promise<unknown>; addEventListener: (name: string, callback: () => void) => void }
type XrApi = { isSessionSupported: (mode: string) => Promise<boolean>; requestSession: (mode: string, options?: object) => Promise<XrSession> }
type XrLayerConstructor = new (session: XrSession, gl: WebGLRenderingContext) => XrLayer

export function QuestVrRoom({ owner = false }: { owner?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef<XrSession | null>(null)
  const [supported, setSupported] = useState(false)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('VR availability is being checked.')
  useEffect(() => {
    let active = true
    void getVrCapabilities().then(({ secure, immersive }) => {
      if (!active) return
      setSupported(immersive)
      setStatus(!secure ? 'VR needs HTTPS and a compatible browser.' : immersive ? 'Quest VR is available.' : 'VR unavailable; use the on-screen preview.')
    })
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
      const layer = new Layer(session, gl)
      session.updateRenderState({ baseLayer: layer })
      let referenceSpace: unknown
      try { referenceSpace = await session.requestReferenceSpace('local-floor') }
      catch { referenceSpace = await session.requestReferenceSpace('local') }
      session.addEventListener('end', () => { sessionRef.current = null; setRunning(false); setStatus('VR session ended.') })
      setRunning(true)
      setStatus('Stereo VR background active. Photorealistic avatar and gesture tracking are not installed yet.')
      const draw = (_time: number, frame: XrFrame) => {
        if (sessionRef.current !== session) return
        const pose = frame.getViewerPose(referenceSpace)
        gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer)
        gl.enable(gl.SCISSOR_TEST)
        for (const view of pose?.views ?? []) {
          const viewport = layer.getViewport(view)
          if (!viewport) continue
          gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height)
          gl.scissor(viewport.x, viewport.y, viewport.width, viewport.height)
          gl.clearColor(0.09, 0.07, 0.19, 1)
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        }
        gl.disable(gl.SCISSOR_TEST)
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
