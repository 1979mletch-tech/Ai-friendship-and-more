import { useState } from 'react'
import { gesturePrompt, type ComfortGesture } from './affection'

const gestures: ComfortGesture[] = ['hug', 'hand', 'pat']
const labels: Record<ComfortGesture, string> = {
  hug: 'Virtual hug', hand: 'Hold hands', pat: 'Friendly pat on the back',
}

export function ComfortControls() {
  const [offered, setOffered] = useState<ComfortGesture | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [quiet, setQuiet] = useState(false)
  const cancel = () => { setOffered(null); setAccepted(false) }
  return <section aria-label="Aurora comfort controls">
    <h3>Comfort, your way</h3>
    <p>Choose what feels right. These are virtual gestures, not physical touch.</p>
    <label><input type="checkbox" checked={quiet} onChange={e => setQuiet(e.target.checked)} /> Quiet, gentle mode</label>
    <p aria-live="polite">{quiet ? 'Aurora will keep things gentle.' : 'Choose a gesture only if you want one.'}</p>
    <div role="group" aria-label="Optional gestures">
      {gestures.map(gesture => <button type="button" key={gesture} onClick={() => { setOffered(gesture); setAccepted(false) }}>{labels[gesture]}</button>)}
    </div>
    {offered && <div role="status">
      <p>{gesturePrompt(offered)}</p>
      {!accepted ? <button type="button" onClick={() => setAccepted(true)}>Yes, please</button> : <p>Sending you a gentle {labels[offered].toLowerCase()} in VR. You can stop at any time.</p>}
      <button type="button" onClick={cancel}>{accepted ? 'Stop' : 'No thanks'}</button>
    </div>}
  </section>
}
