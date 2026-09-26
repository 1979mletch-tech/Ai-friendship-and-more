// Deploy with JWT verification enabled. OPENAI_API_KEY and APP_ORIGIN are
// server-only Edge Function secrets, never VITE_ variables.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { crisisGuidance, isCrisisText } from '../../../src/utils/safety.ts'

const origin = Deno.env.get('APP_ORIGIN')
const headers = (request: Request) => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': origin && request.headers.get('origin') === origin ? origin : '',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
})
const reply = (request: Request, data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: headers(request) })

Deno.serve(async (request) => {
  if (!origin || request.headers.get('origin') !== origin) return reply(request, { error: 'Origin not allowed' }, 403)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(request) })
  if (request.method !== 'POST') return reply(request, { error: 'Method not allowed' }, 405)
  const token = request.headers.get('authorization')?.replace(/^Bearer /i, '')
  if (!token) return reply(request, { error: 'Sign in required' }, 401)
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon || !service) return reply(request, { error: 'Service unavailable' }, 503)

  const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } })
  const { data: { user }, error: authError } = await userClient.auth.getUser(token)
  if (authError || !user) return reply(request, { error: 'Sign in required' }, 401)

  let input: { conversationId?: unknown; text?: unknown }
  try { input = await request.json() } catch { return reply(request, { error: 'Invalid JSON' }, 400) }
  const text = typeof input.text === 'string' ? input.text.trim() : ''
  const id = typeof input.conversationId === 'string' ? input.conversationId : ''
  if (!text || text.length > 2000 || !/^[0-9a-f-]{36}$/i.test(id)) return reply(request, { error: 'Invalid message or conversation' }, 400)

  const { data: conversation, error: lookupError } = await userClient.from('conversations').select('id').eq('id', id).single()
  if (lookupError || !conversation) return reply(request, { error: 'Conversation not found' }, 404)

  const isCrisis = isCrisisText(text)
  if (!isCrisis) {
    if (!Deno.env.get('OPENAI_API_KEY')) return reply(request, { error: 'AI service not configured' }, 503)
    const { data: allowed, error: quotaError } = await userClient.rpc('claim_free_chat_turn')
    if (quotaError) return reply(request, { error: 'Usage check unavailable' }, 503)
    if (!allowed) return reply(request, { error: 'Daily free limit reached' }, 429)
  }

  let responseText = crisisGuidance
  if (!isCrisis) {
    const { data: history } = await userClient.from('chat_messages').select('role,body').eq('conversation_id', id).order('created_at', { ascending: false }).limit(16)
    try {
      const ai = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}` },
        body: JSON.stringify({ model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
          messages: [{ role: 'system', content: 'You are AI Friendship, a clearly identified AI companion. You are not human or a therapist. Be kind and concise. Do not diagnose or promise confidentiality. For immediate danger, advise emergency support.' },
            ...(history || []).reverse().map((m) => ({ role: m.role, content: m.body })),
            { role: 'user', content: text }] }),
        signal: AbortSignal.timeout(20000),
      })
      if (!ai.ok) return reply(request, { error: 'AI service unavailable; try again later' }, 502)
      const result = await ai.json()
      responseText = result.choices?.[0]?.message?.content?.trim()?.slice(0, 4000) || ''
      if (!responseText) return reply(request, { error: 'AI response unavailable; try again later' }, 502)
    } catch { return reply(request, { error: 'AI service unavailable; try again later' }, 502) }
  }

  const admin = createClient(url, service, { auth: { persistSession: false } })
  const { error: saveError } = await admin.from('chat_messages').insert([
    { user_id: user.id, conversation_id: id, role: 'user', body: text },
    { user_id: user.id, conversation_id: id, role: 'assistant', body: responseText },
  ])
  if (saveError) return reply(request, { error: 'Could not save conversation' }, 503)
  await userClient.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id)
  return reply(request, { reply: responseText, safetyFlag: isCrisis })
})
