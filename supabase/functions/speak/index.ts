// Aurora speech is generated only for authenticated, server-verified adults.
// OPENAI_API_KEY and ALLOWED_ORIGIN are server secrets, never VITE_* variables.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const origin = Deno.env.get('ALLOWED_ORIGIN') || ''
const cors = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
}
const json = (error: string, status: number) => new Response(JSON.stringify({ error }), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (!origin || req.headers.get('Origin') !== origin) return json('Origin not allowed', 403)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json('Method not allowed', 405)
  const auth = req.headers.get('Authorization') || ''
  if (!auth.startsWith('Bearer ')) return json('Authentication required', 401)
  const client = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_ANON_KEY') || '', {
    global: { headers: { Authorization: auth } },
  })
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return json('Invalid session', 401)
  if (user.app_metadata?.adult_verified !== true) return json('Adult eligibility verification required', 403)

  let body: unknown
  try { body = await req.json() } catch { return json('Invalid JSON', 400) }
  const text = (body as { text?: unknown } | null)?.text
  if (typeof text !== 'string' || !text.trim() || text.length > 1500) return json('Text must contain 1–1500 characters', 400)
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return json('Speech service is not configured', 503)
  // Shares the existing atomic per-user request allowance with chat. A sample
  // and each spoken reply count as one request, preventing unbounded API spend.
  const { data: reserved, error: quotaError } = await client.rpc('reserve_ai_request')
  if (quotaError) return json('Speech request limit unavailable', 503)
  if (!reserved) return json('Too many requests. Please wait a moment.', 429)

  const allowedVoices = ['shimmer', 'nova', 'alloy', 'echo', 'fable', 'onyx']
  const requestedVoice = typeof (body as { voice?: unknown } | null)?.voice === 'string'
    ? (body as { voice: string }).voice.toLowerCase().trim()
    : ''
  const envVoice = (Deno.env.get('OPENAI_TTS_VOICE') || '').toLowerCase().trim()
  const voice = allowedVoices.includes(requestedVoice)
    ? requestedVoice
    : (allowedVoices.includes(envVoice) ? envVoice : 'shimmer')
  const model = Deno.env.get('OPENAI_TTS_MODEL') || 'tts-1'

  const clientRequestId = crypto.randomUUID()
  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'X-Client-Request-Id': clientRequestId },
      body: JSON.stringify({
        model,
        voice,
        input: text.trim(),
        response_format: 'mp3',
        speed: 0.92,
      }),
      signal: AbortSignal.timeout(25_000),
    })
  } catch { console.error('speech_request_failed', { requestId: clientRequestId }); return json('Speech provider unavailable', 502) }
  const requestId = response.headers.get('x-request-id') || clientRequestId
  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    console.error('speech_response_error', { status: response.status, requestId, error: errorBody })
    return json(response.status === 429 ? 'Aurora voice is busy. Please try again shortly.' : 'Speech provider unavailable', response.status === 429 ? 429 : 502)
  }
  const bytes = await response.arrayBuffer()
  if (!bytes.byteLength || bytes.byteLength > 4_000_000) return json('Invalid speech response', 502)
  return new Response(bytes, { headers: { ...cors, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
})
