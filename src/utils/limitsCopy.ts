export const remainingCopy = (used: number, limit: number) => {
  const remaining=Math.max(0,limit-Math.max(0,used))
  return remaining === 0 ? 'Daily message limit reached.' : `${remaining} messages remaining today.`
}
