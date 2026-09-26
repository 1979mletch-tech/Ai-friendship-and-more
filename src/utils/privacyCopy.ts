export const privacyDeleteLabel=(serverMode:boolean,busy:boolean)=>busy?'Deleting…':serverMode?'Delete account chat history + approved memory':'Delete local chat history + approved memory'
export const privacyScopeText=(serverMode:boolean)=>serverMode?'This requests deletion from your signed-in account before clearing the local copy.':'This deletes data stored by AI Friendship in this browser.'
