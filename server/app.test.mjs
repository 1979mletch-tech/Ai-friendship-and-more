import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createApp } from './app.mjs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('accounts isolate setup, memory, and messages; deletion revokes sessions', async () => {
  const app = createApp({ generateReply: async ({ companion, notes, messages }) => `${companion.name}: ${notes.length} notes, ${messages.at(-1).text}` })
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
    assert.equal((await call('/api/companion', 'POST', { name: 'Muse', tone: 'calm and concise' }, first.cookie)).status, 200)
    assert.equal((await call('/api/notes', 'POST', { project: 'Novel', tags: 'draft', note: 'A lighthouse' }, first.cookie)).status, 201)
    const chat = await call('/api/chat', 'POST', { text: 'Private thought' }, first.cookie)
    assert.equal(chat.status, 201)
    assert.match(chat.data.messages[1].text, /Muse: 1 notes/)
    assert.equal((await call('/api/messages', 'GET', undefined, second.cookie)).data.messages.length, 0)
    assert.equal((await call('/api/messages', 'GET', undefined, first.cookie)).data.messages.length, 2)
    assert.equal((await call('/api/notes', 'GET', undefined, second.cookie)).data.notes.length, 0)
    assert.equal((await call('/api/companion', 'GET', undefined, second.cookie)).data.companion.name, 'Friend')
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

test('unconfigured AI does not save messages; crisis guidance bypasses provider', async () => {
  const app = createApp({ aiKey: '', aiModel: '' })
  app.listen(0, '127.0.0.1')
  await once(app, 'listening')
  try {
    const origin = `http://127.0.0.1:${app.address().port}`
    const send = async (path, body, cookie) => {
      const response = await fetch(origin + path, { method: 'POST', headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) })
      return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0], data: await response.json() }
    }
    const user = await send('/api/register', { email: 'safety@example.com', password: 'long-password-123' })
    assert.equal((await send('/api/chat', { text: 'Hello' }, user.cookie)).status, 503)
    const crisis = await send('/api/chat', { text: 'I want to kill myself' }, user.cookie)
    assert.equal(crisis.status, 201)
    assert.match(crisis.data.messages[1].text, /emergency service/)
    const history = await fetch(origin + '/api/messages', { headers: { Cookie: user.cookie } }).then((res) => res.json())
    assert.equal(history.messages.length, 2)
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

test('account data survives an API restart', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'friend-test-'))
  const databasePath = join(dir, 'app.sqlite')
  let cookie
  try {
    const first = createApp({ databasePath })
    first.listen(0, '127.0.0.1')
    await once(first, 'listening')
    const origin = `http://127.0.0.1:${first.address().port}`
    const registered = await fetch(origin + '/api/register', { method: 'POST', headers: { Origin: origin }, body: JSON.stringify({ email: 'persist@example.com', password: 'long-password-123' }) })
    cookie = registered.headers.get('set-cookie').split(';')[0]
    await fetch(origin + '/api/notes', { method: 'POST', headers: { Origin: origin, Cookie: cookie }, body: JSON.stringify({ project: 'Book', tags: '', note: 'Chapter one' }) })
    await new Promise((resolve) => first.close(resolve))
    const second = createApp({ databasePath })
    second.listen(0, '127.0.0.1')
    await once(second, 'listening')
    const saved = await fetch(`http://127.0.0.1:${second.address().port}/api/notes`, { headers: { Cookie: cookie } }).then((response) => response.json())
    assert.equal(saved.notes[0].note, 'Chapter one')
    await new Promise((resolve) => second.close(resolve))
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
