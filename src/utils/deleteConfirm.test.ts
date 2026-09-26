import { describe, expect, it } from 'vitest'
import { canConfirmAccountDeletion } from './deleteConfirm'
describe('account deletion confirmation',()=>{it('requires explicit DELETE text',()=>{expect(canConfirmAccountDeletion('delete')).toBe(true);expect(canConfirmAccountDeletion('yes')).toBe(false)})})
