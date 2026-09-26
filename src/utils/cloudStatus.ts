export type CloudFeatureStatus = 'not-configured' | 'ready-for-test' | 'verified'
export const cloudStatusCopy = (status: CloudFeatureStatus) => status === 'verified' ? 'Live cloud verification passed.' : status === 'ready-for-test' ? 'Cloud is configured and awaiting live verification.' : 'Cloud is not configured on this deployment.'
