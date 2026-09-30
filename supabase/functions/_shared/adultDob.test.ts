import { describe, expect, it } from 'vitest'
import { isAdultDob } from './adultDob'
const now=new Date('2026-09-29T12:00:00Z')
describe('adult DOB boundary',()=>{
 it('accepts someone who turns 18 today',()=>expect(isAdultDob({year:2008,month:9,day:29},now)).toBe(true))
 it('rejects someone whose 18th birthday is tomorrow',()=>expect(isAdultDob({year:2008,month:9,day:30},now)).toBe(false))
 it('rejects invalid calendar dates and malformed values',()=>{expect(isAdultDob({year:2008,month:2,day:31},now)).toBe(false);expect(isAdultDob(null,now)).toBe(false)})
 it('rejects implausibly old dates',()=>expect(isAdultDob({year:1899,month:12,day:31},now)).toBe(false))
})
