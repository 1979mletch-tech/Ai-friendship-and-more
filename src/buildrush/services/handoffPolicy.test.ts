import { describe, expect, it } from 'vitest';
import { evaluateHandoff } from './handoffPolicy';
const now = new Date('2026-10-16T12:00:00Z');
const base = {id:'job-123', createdAt:'2026-10-14T12:00:00Z', status:'open'};
describe('BuildRush 48-hour sister-site handoff eligibility (no side effects)', () => {
  it('becomes eligible at 48h exactly, with a stable idempotency key', () => {
    expect(evaluateHandoff(base,now)).toEqual({eligible:true,reason:'expired-open-job',idempotencyKey:'buildrush-handoff:job-123'});
  });
  it('cannot transfer before 48h', () => {
    expect(evaluateHandoff({...base,createdAt:'2026-10-14T12:00:01Z'},now).reason).toBe('within-48-hours');
  });
  it('does not transfer completed or cancelled jobs', () => {
    for(const status of ['completed','cancelled']) expect(evaluateHandoff({...base,status},now).eligible).toBe(false);
  });
  it('does not duplicate a previously transferred job', () => {
    expect(evaluateHandoff({...base,sisterJobId:'sister-9'},now).reason).toBe('already-transferred');
    expect(evaluateHandoff({...base,handoffCompletedAt:'2026-10-15T00:00:00Z'},now).reason).toBe('already-transferred');
  });
  it('does not blindly transfer an accepted or matched job', () => {
    expect(evaluateHandoff({...base,status:'matched'},now).reason).toBe('requires-manual-reconciliation');
  });
  it('rejects invalid timestamps', () => {
    expect(evaluateHandoff({...base,createdAt:'oops'},now).eligible).toBe(false);
  });
});