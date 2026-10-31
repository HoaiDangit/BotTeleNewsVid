// Public publisher pages only; no cookies, login bypass, or arbitrary image hosts.
const PUBLISHERS=['vietnamnet.vn','vnexpress.net','dantri.com.vn','tuoitre.vn','thanhnien.vn','nhandan.vn','baochinhphu.vn','vov.vn','vtv.vn','vietnamplus.vn','tienphong.vn','laodong.vn','bbc.com','bbc.co.uk','reuters.com','apnews.com','theguardian.com','techcrunch.com','theverge.com','arstechnica.com'];
const CDN=['vnecdn.net','vnncdn.net','vgcloud.vn','dantri.com.vn','tuoitre.vn','thanhnien.vn','nhandan.vn','baochinhphu.vn','vov.vn','vtv.vn','vietnamplus.vn','tienphong.vn','laodong.vn','bbci.co.uk','bbc.co.uk','bbc.com','reuters.com','reutersmedia.net','apnews.com','dims.apnews.com','guim.co.uk','theguardian.com','techcrunch.com','vox-cdn.com','theverge.com','arstechnica.net','arstechnica.com'];
const matches=(h,list)=>list.some(x=>h===x||h.endsWith('.'+x));
function urlFor(value,base,hosts){const u=new URL(value,base);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!matches(u.hostname,hosts))throw Error('Unsupported publisher image URL');return u.href;}
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>Number(n)<=1114111?String.fromCodePoint(Number(n)):'');
function attrs(tag){const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs))a[m[1].toLowerCase()]=decode(m[3]);return a;}
export function articleImageCandidates(html,article){
 article=urlFor(article,undefined,PUBLISHERS);const results=[],seen=new Set();
 const add=(value,caption='')=>{try{const url=urlFor(value,article,[...CDN,...PUBLISHERS]);if(seen.has(url))return;seen.add(url);results.push({url,caption:String(caption).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,500),sourcePage:article,provider:'article',author:'Chưa xác định; xem chú thích và thông tin quyền tại bài gốc',license:'Article source — rights not independently verified',permissionEvidence:'Chủ bot yêu cầu sử dụng ảnh từ bài báo; không suy ra giấy phép từ việc ảnh hiển thị công khai.',purpose:'Ảnh lấy từ bài nguồn; cần đối chiếu chú thích trước khi đăng lại'});}catch{}};
 const clean=html.replace(/<(script|style|nav|aside|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
 for(const m of clean.matchAll(/<meta\b[^>]*>/gi)){const a=attrs(m[0]);if(['og:image','og:image:secure_url','twitter:image'].includes(a.property||a.name))add(a.content);}
 const body=(clean.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)||[])[1];
 if(body)for(const figure of body.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi)){const caption=(figure[1].match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)||[])[1]||'';for(const img of figure[1].matchAll(/<img\b[^>]*>/gi)){const a=attrs(img[0]);add(a['data-src']||a['data-original']||a.src,caption||a.alt);}}
 return results.slice(0,8);
}
async function bounded(response,max){if(!response.ok)throw Error('Publisher HTTP '+response.status);const r=response.body.getReader(),parts=[];let n=0;try{for(;;){const {done,value}=await r.read();if(done)break;n+=value.length;if(n>max)throw Error('Publisher media too large');parts.push(Buffer.from(value));}}finally{await r.cancel().catch(()=>{});}return Buffer.concat(parts);}
async function get(url,hosts,fetcher){for(let i=0;i<4;i++){url=urlFor(url,undefined,hosts);const r=await fetcher(url,{redirect:'manual',headers:{Accept:'text/html,image/jpeg,image/png,image/webp'},signal:AbortSignal.timeout(12000)});if([301,302,303,307,308].includes(r.status)){await r.body?.cancel();url=urlFor(r.headers.get('location'),url,hosts);continue;}return {response:r,url};}throw Error('Too many publisher redirects');}
export async function articleImages(config,job,{fetcher=fetch}={}){
 if(job.kind==='workout'||config.articleImages===false)return [];
 const initial=urlFor(job.url,undefined,PUBLISHERS),page=await get(initial,PUBLISHERS,fetcher);
 if(!(page.response.headers.get('content-type')||'').includes('text/html'))throw Error('Publisher page is not HTML');
 const html=(await bounded(page.response,2000000)).toString('utf8'),assets=[];
 for(const candidate of articleImageCandidates(html,page.url)){
  try{const {response}=await get(candidate.url,[...CDN,...PUBLISHERS],fetcher),mime=(response.headers.get('content-type')||'').split(';')[0];if(!['image/jpeg','image/png','image/webp'].includes(mime)){await response.body?.cancel();continue;}const bytes=await bounded(response,6000000);const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpeg=bytes[0]===255&&bytes[1]===216,webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';if(!png&&!jpeg&&!webp)continue;if(assets.some(a=>a.bytes.equals(bytes)))continue;assets.push({...candidate,bytes,mime});if(assets.length===2)break;}catch{/* Use the next public source image; never bypass a blocked page. */}
 }
 return assets;
}
