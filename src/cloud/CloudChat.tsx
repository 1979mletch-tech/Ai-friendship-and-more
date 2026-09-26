import { useEffect, useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { cloud, cloudConfigured } from './client'

type Thread = { id: string; title: string; updated_at: string }
type Message = { id: string; role: 'user' | 'assistant'; body: string; created_at: string }
type Note = { id: string; project: string; tags: string; note: string }

export default function CloudChat() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [threads, setThreads] = useState<Thread[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [name, setName] = useState('Friend')
  const [notes, setNotes] = useState<Note[]>([])
  const [noteProject, setNoteProject] = useState('')
  const [noteText, setNoteText] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (!cloud) return
    const client = cloud
    let active = true
    client.auth.getUser().then(({ data }) => { if (active) setUser(data.user) })
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setUser(session?.user ?? null)
      if (!session) { setThreads([]); setThreadId(null); setMessages([]); setNotes([]); setName('Friend') }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!cloud || !user) return
    const client = cloud
    let active = true
    client.from('conversations').select('id,title,updated_at').order('updated_at', { ascending: false }).then(({ data, error }) => {
      if (active) { setThreads(data ?? []); if (error) setStatus('Could not load conversations. Check database setup.') }
    })
    client.from('companion_profiles').select('companion_name').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (active) setName(data?.companion_name ?? 'Friend')
    })
    client.from('project_notes').select('id,project,tags,note').order('updated_at', { ascending: false }).then(({ data }) => {
      if (active) setNotes(data ?? [])
    })
    return () => { active = false }
  }, [user])

  useEffect(() => {
    if (!cloud || !threadId || !user) return
    const client = cloud
    let active = true
    client.from('chat_messages').select('id,role,body,created_at').eq('conversation_id', threadId).order('created_at').then(({ data, error }) => {
      if (active) { setMessages((data ?? []) as Message[]); if (error) setStatus('Could not load messages.') }
    })
    return () => { active = false }
  }, [threadId, user])

  async function account(action: 'signIn' | 'signUp') {
    if (!cloud || busy) return
    setBusy(true); setStatus('')
    const result = action === 'signUp'
      ? await cloud.auth.signUp({ email, password })
      : await cloud.auth.signInWithPassword({ email, password })
    setStatus(result.error?.message ?? (action === 'signUp' && !result.data.session
      ? 'Check your email to confirm your account, then sign in.' : 'Signed in.'))
    setBusy(false)
    setPassword('')
  }

  async function newThread() {
    if (!cloud || !user || busy) return
    const { data, error } = await cloud.from('conversations').insert({ user_id: user.id, title: 'New conversation' }).select('id,title,updated_at').single()
    if (error || !data) { setStatus('Could not start a conversation.'); return }
    setThreads((current) => [data, ...current]); setThreadId(data.id); setMessages([]); setStatus('')
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cloud || !threadId || !input.trim() || busy) return
    setBusy(true); setStatus('')
    const text = input.trim()
    const { data, error } = await cloud.functions.invoke('chat', { body: { conversationId: threadId, text } })
    if (error || data?.error) { setStatus(data?.error ?? 'Message could not be sent.'); setBusy(false); return }
    setInput('')
    const { data: latest } = await cloud.from('chat_messages').select('id,role,body,created_at').eq('conversation_id', threadId).order('created_at')
    setMessages((latest ?? []) as Message[])
    const current = threads.find((thread) => thread.id === threadId)
    if (current?.title === 'New conversation') {
      const title = text.slice(0, 60)
      const { error: renameError } = await cloud.from('conversations').update({ title }).eq('id', threadId)
      if (!renameError) setThreads((items) => items.map((thread) => thread.id === threadId ? { ...thread, title } : thread))
    }
    setBusy(false)
  }

  async function saveName() {
    if (!cloud || !user || !name.trim()) return
    const { error } = await cloud.from('companion_profiles').upsert({ user_id: user.id, companion_name: name.trim().slice(0, 40) })
    setStatus(error ? 'Could not save companion name.' : 'Companion name saved to your account.')
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cloud || !user || !noteProject.trim() || !noteText.trim() || notes.length >= 3) return
    const { data, error } = await cloud.from('project_notes').insert({ user_id: user.id, project: noteProject.trim().slice(0, 100), note: noteText.trim().slice(0, 2000) }).select('id,project,tags,note').single()
    if (error || !data) { setStatus('Could not save project note.'); return }
    setNotes((items) => [data, ...items]); setNoteProject(''); setNoteText('')
  }

  async function deleteNote(id: string) {
    if (!cloud || !window.confirm('Delete this cloud project note?')) return
    const { error } = await cloud.from('project_notes').delete().eq('id', id)
    if (error) { setStatus('Could not delete project note.'); return }
    setNotes((items) => items.filter((note) => note.id !== id))
  }

  async function deleteThread(id: string) {
    if (!cloud || !window.confirm('Delete this cloud conversation and its messages?')) return
    const { error } = await cloud.from('conversations').delete().eq('id', id)
    if (error) { setStatus('Could not delete conversation.'); return }
    setThreads((current) => current.filter((thread) => thread.id !== id))
    if (threadId === id) { setThreadId(null); setMessages([]) }
  }

  async function deleteAccount() {
    if (!cloud || window.prompt('Type DELETE to permanently remove your cloud account and all cloud conversations and notes') !== 'DELETE') return
    setBusy(true); setStatus('')
    const { data, error } = await cloud.functions.invoke('delete-account')
    if (error || !data?.deleted) { setStatus('Account deletion failed. Try again later.'); setBusy(false); return }
    await cloud.auth.signOut()
    setBusy(false)
    setStatus('Cloud account deleted. Local browser data is separate and can be deleted in Privacy.')
  }

  async function exportCloudData() {
    if (!cloud || !user) return
    setBusy(true)
    const [conversationsResult, messagesResult, notesResult, profileResult] = await Promise.all([
      cloud.from('conversations').select('*'),
      cloud.from('chat_messages').select('*'),
      cloud.from('project_notes').select('*'),
      cloud.from('companion_profiles').select('*'),
    ])
    if ([conversationsResult, messagesResult, notesResult, profileResult].some((result) => result.error)) {
      setStatus('Could not export all cloud data. Please try again.'); setBusy(false); return
    }
    const payload = JSON.stringify({ format: 'ai-friendship-cloud-export-v1', exportedAt: new Date().toISOString(),
      conversations: conversationsResult.data, messages: messagesResult.data, notes: notesResult.data, profile: profileResult.data }, null, 2)
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'ai-friendship-cloud-export.json'
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    setBusy(false)
  }

  async function resetPassword() {
    if (!cloud || !email.trim()) { setStatus('Enter your email address first.'); return }
    const { error } = await cloud.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/#/cloud` })
    setStatus(error?.message ?? 'If the account exists, a password reset email has been sent.')
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cloud || password.length < 8) return
    const { error } = await cloud.auth.updateUser({ password })
    setStatus(error?.message ?? 'Password updated.')
    if (!error) { setRecovering(false); setPassword('') }
  }

  if (!cloudConfigured || !cloud) return <section className="panel"><h2>Cloud account and AI chat</h2><p>Cloud chat is not configured. Add the public Supabase URL and publishable key, apply the database migration, and deploy the chat function.</p></section>

  if (!user) return <section className="panel"><h2>Cloud account</h2>
    <p className="small">Cloud chats are linked to your account. Local chats on this device are separate and are never uploaded automatically.</p>
    <form onSubmit={(event) => { event.preventDefault(); void account('signIn') }} className="account-form">
      <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <div className="history-actions"><button disabled={busy} type="submit">Sign in</button><button disabled={busy} type="button" onClick={() => void account('signUp')}>Create account</button><button type="button" onClick={() => void resetPassword()}>Reset password</button></div>
    </form><p role="status">{status}</p>
  </section>

  if (recovering) return <section className="panel"><h2>Set a new password</h2>
    <form onSubmit={updatePassword} className="account-form"><label>New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button>Save new password</button></form><p role="status">{status}</p></section>

  return <section className="panel"><h2>Cloud AI chat</h2>
    <p className="small">Signed in as {user.email}. Messages go to the AI provider through a server function. Do not share details you do not want processed there. This is an AI companion, not a human or therapist.</p>
    <button type="button" onClick={() => void cloud?.auth.signOut()}>Sign out</button>{' '}
    <button type="button" onClick={newThread}>New cloud conversation</button>
    <p><button type="button" disabled={busy} onClick={() => void exportCloudData()}>Download cloud data</button>{' '}
    <button type="button" disabled={busy} onClick={() => void deleteAccount()}>Delete cloud account</button></p>
    <div className="cloud-settings"><h3>Companion setup</h3><label>Companion name <input maxLength={40} value={name} onChange={(event) => setName(event.target.value)} /></label>{' '}<button type="button" onClick={() => void saveName()}>Save name</button></div>
    <div className="cloud-layout"><aside aria-label="Cloud conversations"><h3>Conversations</h3><ul>{threads.map((thread) =>
      <li key={thread.id}><button type="button" onClick={() => setThreadId(thread.id)} aria-current={threadId === thread.id}>{thread.title}</button>{' '}
        <button type="button" onClick={() => deleteThread(thread.id)}>Delete</button></li>)}</ul></aside>
      <div><div className="chat-box" role="log" aria-live="polite"><ul>{messages.map((message) => <li key={message.id}><strong>{message.role === 'user' ? 'You' : 'AI'}:</strong> {message.body}<time className="message-time" dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time></li>)}</ul></div>
        <form onSubmit={send} className="input-row"><input aria-label="Cloud message" maxLength={2000} value={input} onChange={(event) => setInput(event.target.value)} disabled={!threadId || busy} /><button disabled={!threadId || busy || !input.trim()}>Send</button></form></div></div>
    <p role="status" className="warn">{status}</p>
    <div className="cloud-settings"><h3>Cloud project notes</h3><p className="small">Your free account can store up to three notes. Only you can read them through your account.</p>
      <form onSubmit={addNote} className="account-form"><label>Project<input maxLength={100} value={noteProject} onChange={(event) => setNoteProject(event.target.value)} /></label>
        <label>Note<textarea maxLength={2000} value={noteText} onChange={(event) => setNoteText(event.target.value)} /></label><button disabled={notes.length >= 3}>Save note</button></form>
      <ul>{notes.map((note) => <li key={note.id}><strong>{note.project}:</strong> {note.note} <button type="button" onClick={() => void deleteNote(note.id)}>Delete</button></li>)}</ul></div>
  </section>
}
