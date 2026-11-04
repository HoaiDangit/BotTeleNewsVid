const tokens=s=>String(s||'').toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu,' ').trim().split(/\s+/).filter(Boolean);
export function copiedRun(source,text){
 const a=tokens(source),b=tokens(text);let previous=new Uint32Array(a.length+1),longest=0;
 for(const word of b){const next=new Uint32Array(a.length+1);for(let i=0;i<a.length;i++)if(a[i]===word){next[i+1]=previous[i]+1;if(next[i+1]>longest)longest=next[i+1];}previous=next;}return longest;
}
