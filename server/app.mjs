import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const scrypt = promisify(scryptCallback)
const json = (res, status, value, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers })
  res.end(JSON.stringify(value))
}
const tokenHash = (value) => createHash('sha256').update(value).digest('hex')
const cookie = (req) => req.headers.cookie?.split(';').map((item) => item.trim()).find((item) => item.startsWith('friend_session='))?.slice(15)
const sessionCookie = (token, secure) => `friend_session=${token}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=604800${secure ? '; Secure' : ''}`
const clearCookie = (secure) => `friend_session=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0${secure ? '; Secure' : ''}`

export function createApp({ databasePath = ':memory:', secureCookies = false } = {}) {
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true })
  const db = new DatabaseSync(databasePath)
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS messages_user_idx ON messages(user_id, created_at);`)
  const loginAttempts = new Map()

  const server = createServer(async (req, res) => {
    try {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
    if (!pathname.startsWith('/api/')) return json(res, 404, { error: 'Not found' })
    if (!['GET', 'POST', 'DELETE'].includes(req.method ?? '')) return json(res, 405, { error: 'Method not allowed' })
    if (req.method !== 'GET') {
      const origin = req.headers.origin
      const host = req.headers.host
      let validOrigin = false
      try { validOrigin = Boolean(origin && host && new URL(origin).host === host) } catch { /* invalid origin */ }
      if (!validOrigin) return json(res, 403, { error: 'Same-origin request required' })
    }
    let body = {}
    if (req.method === 'POST') {
      try {
        let raw = ''
        for await (const chunk of req) {
          raw += chunk
          if (raw.length > 16384) return json(res, 413, { error: 'Request too large' })
        }
        body = JSON.parse(raw)
      } catch { return json(res, 400, { error: 'Invalid JSON' }) }
    }
    const token = cookie(req)
    const current = token && db.prepare('SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?').get(tokenHash(token), Date.now())
    const publicUser = current ? { id: current.id, email: current.email } : null

    if (pathname === '/api/me' && req.method === 'GET') return json(res, 200, { user: publicUser })
    if (pathname === '/api/register' && req.method === 'POST') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = body.password
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || password.length < 12 || password.length > 256)
        return json(res, 400, { error: 'Use a valid email and a password of 12–256 characters' })
      if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) return json(res, 409, { error: 'Account already exists' })
      const salt = randomBytes(16).toString('hex')
      const derived = await scrypt(password, salt, 64)
      const id = crypto.randomUUID()
      db.prepare('INSERT INTO users VALUES (?, ?, ?, ?)').run(id, email, `${salt}:${derived.toString('hex')}`, new Date().toISOString())
      return establishSession(res, id, email)
    }
    if (pathname === '/api/login' && req.method === 'POST') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = body.password
      const attemptKey = `${req.socket.remoteAddress}:${email}`
      const previous = loginAttempts.get(attemptKey) ?? { count: 0, until: 0 }
      if (previous.count >= 10 && previous.until > Date.now()) return json(res, 429, { error: 'Too many attempts. Try again later.' })
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
      let valid = false
      if (user && typeof password === 'string') {
        const [salt, hash] = user.password_hash.split(':')
        const candidate = await scrypt(password, salt, 64)
        valid = timingSafeEqual(candidate, Buffer.from(hash, 'hex'))
      }
      if (!valid) {
        loginAttempts.set(attemptKey, { count: previous.until > Date.now() ? previous.count + 1 : 1, until: Date.now() + 15 * 60000 })
        return json(res, 401, { error: 'Invalid email or password' })
      }
      loginAttempts.delete(attemptKey)
      return establishSession(res, user.id, user.email)
    }
    if (pathname === '/api/logout' && req.method === 'POST') {
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token))
      return json(res, 200, { user: null }, { 'Set-Cookie': clearCookie(secureCookies) })
    }
    if (!current) return json(res, 401, { error: 'Sign in required' })
    if (pathname === '/api/messages' && req.method === 'GET') {
      return json(res, 200, { messages: db.prepare('SELECT id, role, text, created_at AS createdAt FROM messages WHERE user_id = ? ORDER BY created_at, rowid LIMIT 500').all(current.id) })
    }
    if (pathname === '/api/messages' && req.method === 'POST') {
      if (!['user', 'assistant'].includes(body.role) || typeof body.text !== 'string' || !body.text.trim() || body.text.length > 4000)
        return json(res, 400, { error: 'Invalid message' })
      const message = { id: crypto.randomUUID(), role: body.role, text: body.text.trim(), createdAt: new Date().toISOString() }
      db.prepare('INSERT INTO messages VALUES (?, ?, ?, ?, ?)').run(message.id, current.id, message.role, message.text, message.createdAt)
      return json(res, 201, { message })
    }
    if (pathname === '/api/messages' && req.method === 'DELETE') {
      db.prepare('DELETE FROM messages WHERE user_id = ?').run(current.id)
      return json(res, 200, { messages: [] })
    }
    if (pathname === '/api/account' && req.method === 'DELETE') {
      db.prepare('DELETE FROM users WHERE id = ?').run(current.id)
      return json(res, 200, { user: null }, { 'Set-Cookie': clearCookie(secureCookies) })
    }
    return json(res, 404, { error: 'Not found' })
    } catch {
      if (!res.headersSent) json(res, 500, { error: 'Server error' })
    }
  })

  function establishSession(res, id, email) {
    const token = randomBytes(32).toString('base64url')
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(tokenHash(token), id, Date.now() + 7 * 86400000)
    return json(res, 200, { user: { id, email } }, { 'Set-Cookie': sessionCookie(token, secureCookies) })
  }
  server.on('close', () => db.close())
  return server
}
