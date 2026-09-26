import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (request) => {
  const origin = Deno.env.get('APP_ORIGIN')
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin && request.headers.get('origin') === origin ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
  const response = (data: unknown, status: number) => new Response(JSON.stringify(data), { status, headers })
  if (!origin || request.headers.get('origin') !== origin) return response({ error: 'Origin not allowed' }, 403)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405)
  const token = request.headers.get('authorization')?.replace(/^Bearer /i, '')
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!token) return response({ error: 'Sign in required' }, 401)
  if (!url || !anon || !service) return response({ error: 'Service unavailable' }, 503)
  const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } })
  const { data: { user }, error } = await userClient.auth.getUser(token)
  if (error || !user) return response({ error: 'Sign in required' }, 401)
  const admin = createClient(url, service, { auth: { persistSession: false } })
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) return response({ error: 'Could not delete account' }, 503)
  return response({ deleted: true }, 200)
})
