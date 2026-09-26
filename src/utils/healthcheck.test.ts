import { describe,expect,it } from 'vitest'
import { requiredPreviewChecks,summarizeHealth } from './healthcheck'
describe('preview health',()=>{it('passes complete health',()=>expect(summarizeHealth(requiredPreviewChecks(true,true,true)).ready).toBe(true));it('fails missing asset',()=>expect(summarizeHealth(requiredPreviewChecks(true,false,true)).failed).toBe(1));it('does not call empty checks ready',()=>expect(summarizeHealth([]).ready).toBe(false))})
