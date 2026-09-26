import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createApp } from './app.mjs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

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
    const firstThread = (await call('/api/conversations', 'POST', {}, first.cookie)).data.conversation
    const secondThread = (await call('/api/conversations', 'POST', {}, second.cookie)).data.conversation
    assert.equal((await call('/api/companion', 'POST', { name: 'Muse', tone: 'calm and concise' }, first.cookie)).status, 200)
    assert.equal((await call('/api/notes', 'POST', { project: 'Novel', tags: 'draft', note: 'A lighthouse' }, first.cookie)).status, 201)
    const chat = await call('/api/chat', 'POST', { text: 'Private thought', conversationId: firstThread.id }, first.cookie)
    assert.equal(chat.status, 201)
    assert.match(chat.data.messages[1].text, /Muse: 1 notes/)
    assert.equal((await call('/api/messages', 'GET', undefined, second.cookie)).data.messages.length, 0)
    assert.equal((await call('/api/messages', 'GET', undefined, first.cookie)).data.messages.length, 2)
    assert.equal((await call('/api/notes', 'GET', undefined, second.cookie)).data.notes.length, 0)
    assert.equal((await call('/api/companion', 'GET', undefined, second.cookie)).data.companion.name, 'Friend')
    assert.equal((await call(`/api/messages?conversationId=${firstThread.id}`, 'GET', undefined, second.cookie)).status, 404)
    assert.equal((await call('/api/chat', 'POST', { text: 'Unauthorized', conversationId: secondThread.id }, first.cookie)).status, 404)
    assert.equal((await call(`/api/conversations/${firstThread.id}`, 'POST', { title: 'Private project' }, second.cookie)).status, 404)
    assert.equal((await call(`/api/notes/${(await call('/api/notes', 'GET', undefined, first.cookie)).data.notes[0].id}`, 'POST', { project: 'Stolen', tags: '', note: 'No' }, second.cookie)).status, 404)
    assert.equal((await call('/api/usage', 'GET', undefined, first.cookie)).data.messagesToday, 1)
    const noteId = (await call('/api/notes', 'GET', undefined, first.cookie)).data.notes[0].id
    assert.equal((await call(`/api/notes/${noteId}`, 'POST', { project: 'Novel', tags: 'edited', note: 'New chapter' }, first.cookie)).data.note.note, 'New chapter')
    assert.equal((await call(`/api/conversations/${firstThread.id}`, 'POST', { title: 'Novel planning' }, first.cookie)).status, 200)
    assert.equal((await call(`/api/conversations/${firstThread.id}`, 'DELETE', undefined, first.cookie)).status, 200)
    assert.equal((await call('/api/messages', 'GET', undefined, first.cookie)).data.messages.length, 0)
    assert.equal((await call('/api/usage', 'GET', undefined, first.cookie)).data.messagesToday, 1)
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
    const thread = (await send('/api/conversations', {}, user.cookie)).data.conversation
    assert.equal((await send('/api/chat', { text: 'Hello', conversationId: thread.id }, user.cookie)).status, 503)
    const crisis = await send('/api/chat', { text: 'I want to kill myself', conversationId: thread.id }, user.cookie)
    assert.equal(crisis.status, 201)
    assert.match(crisis.data.messages[1].text, /emergency service/)
    const history = await fetch(origin + '/api/messages', { headers: { Cookie: user.cookie } }).then((res) => res.json())
    assert.equal(history.messages.length, 2)
    assert.equal((await fetch(origin + '/api/usage', { headers: { Cookie: user.cookie } }).then((res) => res.json())).messagesToday, 0)
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

test('upgrades prior message rows into a conversation without losing history', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'friend-migrate-'))
  const databasePath = join(dir, 'old.sqlite')
  try {
    const old = new DatabaseSync(databasePath)
    old.exec("CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL); CREATE TABLE messages (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL);")
    old.prepare('INSERT INTO users VALUES (?, ?, ?, ?)').run('u1', 'old@example.com', 'unused', new Date().toISOString())
    old.prepare('INSERT INTO messages VALUES (?, ?, ?, ?, ?)').run('m1', 'u1', 'user', 'Earlier message', new Date().toISOString())
    old.close()
    const upgraded = createApp({ databasePath })
    upgraded.listen(0, '127.0.0.1')
    await once(upgraded, 'listening')
    await new Promise((resolve) => upgraded.close(resolve))
    const check = new DatabaseSync(databasePath)
    const item = check.prepare('SELECT messages.text, conversations.title FROM messages JOIN conversations ON conversations.id = messages.conversation_id').get()
    assert.equal(item.text, 'Earlier message')
    assert.equal(item.title, 'Earlier chat')
    check.close()
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('feedback, complete export, and password change respect account boundaries', async () => {
  const app = createApp({ generateReply: async () => 'A helpful reply' })
  app.listen(0, '127.0.0.1')
  await once(app, 'listening')
  const origin = `http://127.0.0.1:${app.address().port}`
  const call = async (path, method = 'GET', body, cookie) => {
    const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) })
    return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0], data: await response.json() }
  }
  try {
    const one = await call('/api/register', 'POST', { email: 'owner@example.com', password: 'first-password-123' })
    const other = await call('/api/register', 'POST', { email: 'other@example.com', password: 'first-password-123' })
    const thread = (await call('/api/conversations', 'POST', {}, one.cookie)).data.conversation
    const reply = (await call('/api/chat', 'POST', { text: 'My project', conversationId: thread.id }, one.cookie)).data.messages[1]
    assert.equal((await call('/api/feedback', 'POST', { messageId: reply.id, rating: 'yes' }, other.cookie)).status, 404)
    assert.equal((await call('/api/feedback', 'POST', { messageId: reply.id, rating: 'yes' }, one.cookie)).status, 200)
    const another = (await call('/api/conversations', 'POST', {}, one.cookie)).data.conversation
    await call('/api/chat', 'POST', { text: 'Another topic', conversationId: another.id }, one.cookie)
    const exported = await call('/api/export', 'GET', undefined, one.cookie)
    assert.equal(exported.data.conversations.length, 2)
    assert.equal(exported.data.messages.length, 4)
    assert.equal(exported.data.feedback.length, 1)
    assert.equal(exported.data.account.email, 'owner@example.com')
    assert.equal(JSON.stringify(exported.data).includes('password_hash'), false)
    assert.equal((await call('/api/export', 'GET', undefined, other.cookie)).data.messages.length, 0)
    const secondSession = await call('/api/login', 'POST', { email: 'owner@example.com', password: 'first-password-123' })
    assert.equal((await call('/api/sessions', 'GET', undefined, one.cookie)).data.sessions.length, 2)
    await call('/api/sessions/others', 'DELETE', undefined, one.cookie)
    assert.equal((await call('/api/me', 'GET', undefined, secondSession.cookie)).data.user, null)
    assert.equal((await call('/api/password', 'POST', { currentPassword: 'wrong', newPassword: 'second-password-123' }, one.cookie)).status, 401)
    assert.equal((await call('/api/password', 'POST', { currentPassword: 'first-password-123', newPassword: 'second-password-123' }, one.cookie)).status, 200)
    assert.equal((await call('/api/me', 'GET', undefined, one.cookie)).data.user, null)
    assert.equal((await call('/api/login', 'POST', { email: 'owner@example.com', password: 'first-password-123' })).status, 401)
    assert.equal((await call('/api/login', 'POST', { email: 'owner@example.com', password: 'second-password-123' })).status, 200)
  } finally { app.close() }
})
