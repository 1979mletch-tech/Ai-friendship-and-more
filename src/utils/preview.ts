export const PREVIEW_BUILD_LABEL = 'AI Friendship staging preview'

export const previewNotice = (cloudConfigured: boolean) =>
  cloudConfigured
    ? 'STAGING PREVIEW · Test data only. Cloud features are being verified before launch.'
    : 'LOCAL PREVIEW · Cloud accounts and live AI are not configured on this deployment.'

export const shouldUseSyntheticData = (hostname: string) =>
  hostname !== 'localhost' && hostname !== '127.0.0.1'
