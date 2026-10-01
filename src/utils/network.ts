export type NetworkState = 'online' | 'offline'

export const currentNetworkState = (online = navigator.onLine): NetworkState => online ? 'online' : 'offline'

export const networkCopy = (state: NetworkState) =>
  state === 'offline'
    ? 'You appear to be offline. Local features still work; cloud sync and live AI will wait for a connection.'
    : ''
