/** Pure eligibility policy only. Never performs an external transfer or changes a production record. */
export type TransferJob = {
  id: string;
  createdAt: string; // ISO timestamp with timezone
  status: 'open' | 'matched' | 'completed' | 'cancelled' | string;
  handoffCompletedAt?: string | null;
  sisterJobId?: string | null;
};
export type TransferVerdict = {eligible: boolean; reason: string; idempotencyKey?: string};
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * A job must NOT move merely because its 48-hour badge expires:
 * verify it remains incomplete and is not already handed off.
 * 'matched' requires explicit operational reconciliation rather than blind transfer.
 */
export function evaluateHandoff(job: TransferJob, now: Date): TransferVerdict {
  if (!job || !job.id || !Number.isFinite(now.getTime())) return {eligible:false, reason:'invalid-input'};
  if (job.sisterJobId || job.handoffCompletedAt) return {eligible:false, reason:'already-transferred'};
  if (job.status === 'completed' || job.status === 'cancelled') return {eligible:false, reason:'closed'};
  if (job.status !== 'open') return {eligible:false, reason:'requires-manual-reconciliation'};
  const created = Date.parse(job.createdAt);
  if (!Number.isFinite(created)) return {eligible:false, reason:'invalid-created-at'};
  const elapsed = now.getTime() - created;
  if (elapsed < FORTY_EIGHT_HOURS_MS) return {eligible:false, reason:'within-48-hours'};
  return {eligible:true, reason:'expired-open-job', idempotencyKey:'buildrush-handoff:'+job.id};
}
/**
 * Future adapter must:
 * 1. authenticate against both APIs with separate least-privilege credentials
 * 2. transmit only authorized job fields, avoid passing Stripe/payment secrets
 * 3. create once by immutable idempotency key
 * 4. verify sister job exists BEFORE setting handoffCompletedAt
 * 5. keep original audit/history and reconcile partial failures
 * 6. never auto-switch payment or subscription plans
 */
