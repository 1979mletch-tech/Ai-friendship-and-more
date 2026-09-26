import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'DELETE') return json({ error: 'Method not allowed' }, 405)

  const auth = req.headers.get('Authorization') || ''
  if (!auth.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401)

  const url = Deno.env.get('SUPABASE_URL') || ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') || ''
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } })
  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) return json({ error: 'Invalid session' }, 401)
  if (!serviceRole) return json({ error: 'Account deletion is not configured' }, 503)

  const admin = createClient(url, serviceRole)
  const result = await admin.auth.admin.deleteUser(user.id)
  if (result.error) return json({ error: 'Account deletion failed' }, 500)
  return json({ deleted: true })
})
