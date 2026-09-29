export type StoredSubscription = {
  livemode: boolean
  status: string
  plan: string
  stripe_customer_id: string
}

export const livePaidSubscription = (row: StoredSubscription | null): row is StoredSubscription =>
  row?.livemode === true && (row.status === 'active' || row.status === 'trialing')

export const liveCustomerSubscription = (row: StoredSubscription | null): StoredSubscription | null =>
  row?.livemode === true ? row : null
