export const readRecoveryAccessToken = (hash = window.location.hash): string => {
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : hash.replace(/^#/, '')
  const params = new URLSearchParams(query)
  if (params.get('type') !== 'recovery') return ''
  return params.get('access_token') || ''
}

export const isSafePassword = (password: string) =>
  password.length >= 8 && password.length <= 128

export const recoveryRoute = (hash = window.location.hash) =>
  readRecoveryAccessToken(hash) ? '/account' : null
