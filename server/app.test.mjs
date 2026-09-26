import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createApp } from './app.mjs'

test('accounts isolate messages and deletion revokes sessions', async () => {
  const app = createApp()
  app.listen(0, '127.0.0.1')
  await once(app, 'listening')
  const origin = `http://127.0.0.1:${app.address().port}`
  const call = async (path, method = 'GET', body, cookie) => {
    const response = await fetch(origin + path, {
      method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body && JSON.stringify(body),
    })
    return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0], data: await response.json() }
  }
  try {
    const first = await call('/api/register', 'POST', { email: 'one@example.com', password: 'long-password-123' })
    const second = await call('/api/register', 'POST', { email: 'two@example.com', password: 'long-password-123' })
    assert.equal(first.status, 200)
    assert.equal(second.status, 200)
    assert.equal((await call('/api/messages', 'POST', { role: 'user', text: 'Private thought' }, first.cookie)).status, 201)
    assert.equal((await call('/api/messages', 'GET', undefined, second.cookie)).data.messages.length, 0)
    assert.equal((await call('/api/messages', 'GET', undefined, first.cookie)).data.messages.length, 1)
    const signedIn = await call('/api/login', 'POST', { email: 'two@example.com', password: 'long-password-123' })
    assert.equal(signedIn.status, 200)
    assert.equal((await call('/api/me', 'GET', undefined, signedIn.cookie)).data.user.email, 'two@example.com')
    assert.equal((await call('/api/logout', 'POST', {}, signedIn.cookie)).status, 200)
    assert.equal((await call('/api/me', 'GET', undefined, signedIn.cookie)).data.user, null)
    assert.equal((await call('/api/account', 'DELETE', undefined, first.cookie)).status, 200)
    assert.equal((await call('/api/messages', 'GET', undefined, first.cookie)).status, 401)
    assert.equal((await call('/api/login', 'POST', { email: 'one@example.com', password: 'long-password-123' })).status, 401)
    assert.equal((await call('/api/messages', 'GET', undefined, second.cookie)).status, 200)
  } finally { app.close() }
})

test('rejects cross-origin writes and invalid passwords', async () => {
  const app = createApp()
  app.listen(0, '127.0.0.1')
  await once(app, 'listening')
  try {
    const origin = `http://127.0.0.1:${app.address().port}`
    const rejected = await fetch(origin + '/api/register', { method: 'POST', headers: { Origin: 'https://attacker.example' }, body: '{}' })
    assert.equal(rejected.status, 403)
    const weak = await fetch(origin + '/api/register', { method: 'POST', headers: { Origin: origin }, body: JSON.stringify({ email: 'a@example.com', password: 'short' }) })
    assert.equal(weak.status, 400)
  } finally { app.close() }
})
