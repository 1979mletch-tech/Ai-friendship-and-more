import { describe,expect,it,vi } from 'vitest'
import { clearKnownLocalData,LOCAL_DATA_KEYS } from './dataDelete'
describe('local deletion',()=>{it('removes every declared key',()=>{const removeItem=vi.fn();clearKnownLocalData({removeItem});expect(removeItem).toHaveBeenCalledTimes(LOCAL_DATA_KEYS.length)})})
