import { describe, expect, it } from 'vitest'
import { focusTargetAfterRoute, shouldRestoreFocus } from './focus'
describe('route focus',()=>{it('targets chat heading',()=>expect(focusTargetAfterRoute('/chat')).toBe('chat-heading'));it('restores only on route change',()=>expect(shouldRestoreFocus('/','/chat')).toBe(true))})
