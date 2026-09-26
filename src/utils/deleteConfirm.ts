export const DELETE_ACCOUNT_CONFIRMATION = 'DELETE'
export const canConfirmAccountDeletion = (value: string) => value.trim().toUpperCase() === DELETE_ACCOUNT_CONFIRMATION
export const deletionWarning = 'Deleting your account is permanent. Cloud account data will be removed when the live deletion service succeeds.'
