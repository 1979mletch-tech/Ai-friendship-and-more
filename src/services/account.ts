export type Account = { id: string; email: string }
export type SavedMessage = { id: string; role: 'user' | 'assistant'; text: string; createdAt: string }

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method,
    credentials: 'same-origin',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Request failed')
  return result as T
}

export const accountApi = {
  me: () => request<{ user: Account | null }>('me'),
  register: (email: string, password: string) => request<{ user: Account }>('register', 'POST', { email, password }),
  login: (email: string, password: string) => request<{ user: Account }>('login', 'POST', { email, password }),
  logout: () => request('logout', 'POST', {}),
  messages: () => request<{ messages: SavedMessage[] }>('messages'),
  saveMessage: (role: SavedMessage['role'], text: string) => request<{ message: SavedMessage }>('messages', 'POST', { role, text }),
  deleteMessages: () => request('messages', 'DELETE'),
  deleteAccount: () => request('account', 'DELETE'),
}
