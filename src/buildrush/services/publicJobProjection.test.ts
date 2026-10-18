import { describe, it, expect } from 'vitest';
import { toPublicJob } from './publicJobProjection';
describe('BuildRush public job projection',()=>{
 it('excludes sensitive fields and future arbitrary additions',()=>{
  const result = toPublicJob({
   id:'123',title:'Leaking tap',category:'Plumbing',fixed_price:120,
   location_city:'Weston-super-Mare',status:'open',timeframe:'Within 48h',
   customer_email:'homeowner@example.test',customer_name:'Jane',
   postcode:'BS23 9XX',payment_session_id:'cs_live_sensitive',
   matched_tradesperson:'Private Name',secretFutureField:'do not leak'
  });
  expect(result).toEqual({
   id:'123',title:'Leaking tap',category:'Plumbing',fixed_price:120,
   location_city:'Weston-super-Mare',status:'open',timeframe:'Within 48h'
  });
  expect(JSON.stringify(result)).not.toMatch(/customer_email|postcode|payment_session|secretFutureField|example\.test/);
 });
 it('rejects bogus price rather than reflecting it',()=>{
  expect(toPublicJob({fixed_price:'£500',customer_email:'hidden'}).fixed_price).toBe(0);
 });
});
