export const statusAnnouncement = (sending: boolean, error = '') => error ? `Error: ${error}` : sending ? 'AI Friendship is preparing a response.' : ''
export const messageAriaLabel = (role: 'user'|'assistant', companionName='Friend') => role === 'user' ? 'Your message' : `${companionName || 'Friend'} AI response`
