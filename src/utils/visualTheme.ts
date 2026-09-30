export const auroraTheme:Record<'background'|'surface'|'text'|'muted'|'focus',string>={background:'#090817',surface:'#121028',text:'#f8f6ff',muted:'#aaa5c2',focus:'#bfeeff'}
export const hasReadableThemeBasics=()=>auroraTheme.background!==auroraTheme.text&&auroraTheme.surface!==auroraTheme.text
