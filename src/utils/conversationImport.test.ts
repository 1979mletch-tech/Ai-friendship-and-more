import { describe, expect, it } from 'vitest'
import { sanitizeImportedMessages } from './conversationImport'
describe('conversation import', () => {
  it('drops malformed records and bounds text', () => {
    const result=sanitizeImportedMessages([{role:'user',text:'x'.repeat(2100),id:'1'},{role:'system',text:'bad'}])
    expect(result).toHaveLength(1); expect(result[0]?.text).toHaveLength(2000)
  })
})
