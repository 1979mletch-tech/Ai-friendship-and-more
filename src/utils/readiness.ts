export type StagingReadiness = {
  cloudConfigured: boolean
  chatConfigured: boolean
  https: boolean
  warnings: string[]
}

export const getStagingReadiness = (config: { supabaseUrl: string; supabaseAnonKey: string; chatApiUrl: string }, protocol = window.location.protocol): StagingReadiness => {
  const cloudConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey)
  const chatConfigured = Boolean(config.chatApiUrl)
  const warnings: string[] = []
  if (!cloudConfigured) warnings.push('Cloud account configuration is missing.')
  if (!chatConfigured) warnings.push('Live AI endpoint is missing.')
  if (protocol !== 'https:' && protocol !== 'http:') warnings.push('Unexpected deployment protocol.')
  return { cloudConfigured, chatConfigured, https: protocol === 'https:', warnings }
}
