export type Preferences={companionName:string;tone:'warm'|'calm'|'creative'|'direct';interests:string;memoryEnabled:boolean}
export const mergePreferences=(local:Preferences,cloud:Partial<Preferences>|null):Preferences=>cloud?{...local,...cloud,companionName:cloud.companionName?.trim()||local.companionName,interests:(cloud.interests??local.interests).slice(0,500)}:local
