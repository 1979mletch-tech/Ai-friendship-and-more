export const safeLocalStorageGet = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    if (!value) return fallback
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export const safeLocalStorageSet = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Intentionally ignore to preserve local fallback behavior.
  }
}

export const safeLocalStorageDelete = (...keys: string[]): void => {
  for (const key of keys) {
    try {
      localStorage.removeItem(key)
    } catch {
      // Intentionally ignore to preserve local fallback behavior.
    }
  }
}
