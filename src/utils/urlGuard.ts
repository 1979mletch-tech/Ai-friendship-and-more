export const isHttpsUrl=(value:string)=>{try{return new URL(value).protocol==='https:'}catch{return false}}
export const sameOriginUrl=(value:string,origin:string)=>{try{return new URL(value,origin).origin===new URL(origin).origin}catch{return false}}
export const stripUrlQuery=(value:string)=>{try{const u=new URL(value);u.search='';u.hash='';return u.toString()}catch{return ''}}
