export const PRIVATE_QUERY_KEYS = ['message','prompt','memory','conversation','email','token','password'] as const

export const containsPrivateQueryKey = (url: string) => {
  try {
    const parsed = new URL(url, 'https://local.invalid')
    return PRIVATE_QUERY_KEYS.some((key) => parsed.searchParams.has(key))
  } catch { return true }
}
