export const safeReturnPath = (value: string | null | undefined) => {
  if (!value || !value.startsWith('#/')) return '#/'
  if (/[:\\]/.test(value)) return '#/'
  return value.slice(0, 160)
}

export const rememberReturnPath = (storage: Pick<Storage, 'setItem'>, hash: string) =>
  storage.setItem('ai_friendship_return_path', safeReturnPath(hash))

export const consumeReturnPath = (storage: Pick<Storage, 'getItem' | 'removeItem'>) => {
  const value = safeReturnPath(storage.getItem('ai_friendship_return_path'))
  storage.removeItem('ai_friendship_return_path')
  return value
}
