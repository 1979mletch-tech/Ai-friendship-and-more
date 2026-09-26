export type EvidenceState='code-built'|'ci-verified'|'configured'|'live-tested'|'not-tested'
export const evidenceRank=(state:EvidenceState)=>({ 'not-tested':0,'code-built':1,'ci-verified':2,'configured':2,'live-tested':3 }[state])
export const canClaimLive=(state:EvidenceState)=>state==='live-tested'
export const evidenceCopy=(state:EvidenceState)=>state.replace('-', ' ').toUpperCase()
