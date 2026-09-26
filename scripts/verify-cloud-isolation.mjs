// Live staging test. Requires two existing disposable test accounts.
// Never print passwords, bearer tokens or saved content.
import { randomUUID } from 'node:crypto'

const required = [
  'STAGING_SUPABASE_URL', 'STAGING_SUPABASE_ANON_KEY', 'STAGING_EXPECTED_HOST',
  'STAGING_TEST_EMAIL_A', 'STAGING_TEST_PASSWORD_A',
  'STAGING_TEST_EMAIL_B', 'STAGING_TEST_PASSWORD_B',
]
const missing = required.filter((name) => !process.env[name])
if (missing.length) throw new Error(`Missing staging configuration: ${missing.join(', ')}`)

const base = new URL(process.env.STAGING_SUPABASE_URL)
if (base.protocol !== 'https:' || base.hostname !== process.env.STAGING_EXPECTED_HOST) {
  throw new Error('Staging URL must be HTTPS and match STAGING_EXPECTED_HOST exactly.')
}
const anon = process.env.STAGING_SUPABASE_ANON_KEY

const request = async (path, token, method = 'GET', body) => {
  const response = await fetch(new URL(path, base), {
    method,
    headers: {
      apikey: anon,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const payload = await response.json().catch(() => null)
  return { status: response.status, payload }
}

const signIn = async (email, password) => {
  const result = await request('/auth/v1/token?grant_type=password', null, 'POST', { email, password })
  if (result.status !== 200 || !result.payload?.access_token || !result.payload?.user?.id) {
    throw new Error('A staging test account could not sign in.')
  }
  return { token: result.payload.access_token, id: result.payload.user.id }
}

const assert = (condition, label) => { if (!condition) throw new Error(`FAIL: ${label}`) }
const a = await signIn(process.env.STAGING_TEST_EMAIL_A, process.env.STAGING_TEST_PASSWORD_A)
const b = await signIn(process.env.STAGING_TEST_EMAIL_B, process.env.STAGING_TEST_PASSWORD_B)
assert(a.id !== b.id, 'Test accounts must be different users')

const cases = [
  { table: 'memories', id: randomUUID(), row: { label: 'Isolation test', value: 'synthetic staging fixture' }, update: { value: 'changed by B' } },
  { table: 'conversations', id: randomUUID(), row: { title: 'Isolation test', mode: 'general', messages: [] }, update: { title: 'changed by B' } },
]
const insertedAsOther = []

try {
  for (const item of cases) {
    const route = `/rest/v1/${item.table}`
    const own = await request(route, a.token, 'POST', { id: item.id, user_id: a.id, ...item.row })
    assert(own.status >= 200 && own.status < 300, `${item.table}: A can create its own fixture`)
    const query = `${route}?id=eq.${item.id}&select=*`
    const otherRead = await request(query, b.token)
    assert(otherRead.status === 200 && Array.isArray(otherRead.payload) && otherRead.payload.length === 0, `${item.table}: B cannot read A's row`)
    await request(`${route}?id=eq.${item.id}`, b.token, 'PATCH', item.update)
    await request(`${route}?id=eq.${item.id}`, b.token, 'DELETE')
    const ownerRead = await request(query, a.token)
    assert(ownerRead.status === 200 && ownerRead.payload?.length === 1, `${item.table}: B cannot delete A's row`)
    for (const [field, original] of Object.entries(item.row)) {
      assert(JSON.stringify(ownerRead.payload[0][field]) === JSON.stringify(original), `${item.table}: B cannot change ${field}`)
    }
    const attemptedId = randomUUID()
    insertedAsOther.push({ table: item.table, id: attemptedId })
    const otherInsert = await request(route, b.token, 'POST', { id: attemptedId, user_id: a.id, ...item.row })
    assert(otherInsert.status >= 400, `${item.table}: B cannot insert a row owned by A`)
    console.log(`PASS ${item.table}: cross-account read, update, delete and insert blocked`)
  }
} finally {
  for (const item of cases) await request(`/rest/v1/${item.table}?id=eq.${item.id}&user_id=eq.${a.id}`, a.token, 'DELETE')
  for (const item of insertedAsOther) await request(`/rest/v1/${item.table}?id=eq.${item.id}&user_id=eq.${a.id}`, a.token, 'DELETE')
}
