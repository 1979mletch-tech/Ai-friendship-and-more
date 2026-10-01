export const isNarrowViewport=(width:number)=>width<=640
export const comfortableTapTarget=(width:number,height:number)=>width>=44&&height>=44
export const chatViewportHeight=(viewportHeight:number)=>Math.max(220,Math.floor(viewportHeight*0.48))
