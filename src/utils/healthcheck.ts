export type HealthCheck={name:string;ok:boolean;detail:string}
export const summarizeHealth=(checks:HealthCheck[])=>({passed:checks.filter(x=>x.ok).length,failed:checks.filter(x=>!x.ok).length,total:checks.length,ready:checks.length>0&&checks.every(x=>x.ok)})
export const requiredPreviewChecks=(https:boolean,assets:boolean,route:boolean):HealthCheck[]=>[
{name:'https',ok:https,detail:https?'HTTPS active':'HTTPS missing'},
{name:'assets',ok:assets,detail:assets?'Assets loaded':'Assets failed'},
{name:'route',ok:route,detail:route?'App rendered':'App did not render'}]
