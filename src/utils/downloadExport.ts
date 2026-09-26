import{buildDataExport,serializeDataExport}from'./privacyExport'
export const downloadDataExport=(companion:unknown,conversations:unknown,memories:unknown)=>{
 const blob=new Blob([serializeDataExport(buildDataExport(companion,conversations,memories))],{type:'application/json'})
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ai-friendship-data.json';a.click();URL.revokeObjectURL(url)
}
