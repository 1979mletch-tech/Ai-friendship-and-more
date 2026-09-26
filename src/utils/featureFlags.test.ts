import { describe, expect, it } from 'vitest'
import { deriveFeatureFlags } from './featureFlags'
describe('feature flags',()=>{it('does not expose live AI without auth cloud',()=>expect(deriveFeatureFlags({cloudConfigured:false,chatConfigured:true,billingConfigured:false}).liveAi).toBe(false))})
