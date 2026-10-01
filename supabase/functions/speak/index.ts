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

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: 'marin',
        input: text.trim(),
        instructions: 'Speak as Aurora in English with a gentle, subtle Polish accent. Use a calm, soft, distinctly feminine and naturally warm conversational voice. Sound reassuring and emotionally present, with a serene slightly dreamy quality. Keep the pace relaxed and unhurried, with smooth fluid intonation, clear articulation, natural short pauses and gentle warmth. Keep the Polish accent light and consistent rather than exaggerated. Be intimate without whispering, breathiness or exaggerated sensuality. Avoid theatrical emphasis, chirpy enthusiasm, harshness, monotone cadence or anything robotic. Every line should sound kind, composed, comforting and easy to listen to.',
        response_format: 'mp3',
      }),
      signal: AbortSignal.timeout(25_000),
    })
  } catch { return json('Speech provider unavailable', 502) }
  if (!response.ok) return json('Speech provider unavailable', 502)
  const bytes = await response.arrayBuffer()
  if (!bytes.byteLength || bytes.byteLength > 4_000_000) return json('Invalid speech response', 502)
  return new Response(bytes, { headers: { ...cors, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
})
