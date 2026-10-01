export const publicNavigation=[['Home','/'],['Chat','/chat'],['History','/history'],['Memory','/memory'],['Settings','/settings'],['Account','/account'],['Pricing','/pricing'],['Privacy','/privacy'],['Immersive','/immersive']] as const
export const navLabelFor=(path:string)=>publicNavigation.find(([,href])=>href===path)?.[0]??'Home'
