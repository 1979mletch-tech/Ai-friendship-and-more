import type { AuthSession } from '../services/authService'

// Guest data retains its existing keys. Account data is isolated per user ID
// within this browser; this is privacy separation, not encrypted storage.
export const localAccountKey = (key: string, session: AuthSession | null): string =>
  session ? `${key}:account:${session.user.id}` : key

export const accountDataKeys = (session: AuthSession | null) => [
  localAccountKey('ai_friendship_messages', session),
  localAccountKey('ai_friendship_project_notes', session),
  localAccountKey('ai_friendship_memory', session),
  localAccountKey('ai_friendship_cloud_conversation_id', session),
]

export const accountDeletionKeys = (session: AuthSession) => [
  ...accountDataKeys(session),
  localAccountKey('ai_friendship_consent', session),
  localAccountKey('ai_friendship_companion_name', session),
]
