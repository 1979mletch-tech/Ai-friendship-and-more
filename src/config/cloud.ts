export type CloudConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  chatApiUrl: string
}

export const readCloudConfig = (source: Record<string, string | undefined> = import.meta.env): CloudConfig => ({
  supabaseUrl: (source.VITE_SUPABASE_URL || '').replace(/\/$/, ''),
  supabaseAnonKey: source.VITE_SUPABASE_ANON_KEY || '',
  chatApiUrl: source.VITE_CHAT_API_URL || '',
})

export const hasCloudAuth = (config = readCloudConfig()) =>
  Boolean(config.supabaseUrl && config.supabaseAnonKey)
