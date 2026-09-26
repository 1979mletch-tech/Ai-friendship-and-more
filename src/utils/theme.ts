export type ThemePreference='system'|'dark'|'light'
export const normalizeTheme=(value:unknown):ThemePreference=>value==='dark'||value==='light'?value:'system'
export const resolvedTheme=(preference:ThemePreference,prefersDark:boolean)=>preference==='system'?(prefersDark?'dark':'light'):preference
