export const safeHashPath = (hash: string) => {
  const path = hash.replace(/^#/, '').split('?')[0]
  const allowed = new Set(['/','/chat','/history','/memory','/settings','/account','/pricing','/privacy','/immersive'])
  return allowed.has(path) ? path : '/'
}
