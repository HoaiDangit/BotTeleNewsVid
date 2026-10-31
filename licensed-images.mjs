import {drawSketch} from './sketch-images.mjs';
import {driveImages} from './drive-images.mjs';
import {articleImages} from './article-images.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
export function imageQuery(job){
 const t=normalized(job.title+' '+(job.excerpt||''));
 const topics=[[/\b(ai|gemini|chatgpt|tri tue nhan tao|robot)\b/,'artificial intelligence computer'],[/\b(mat troi|solar)\b/,'solar panels'],[/\b(moi truong|khi hau|climate)\b/,'forest landscape'],[/\b(du lich|tourism)\b/,'tourism landscape'],[/\b(chip|ban dan|semiconductor)\b/,'semiconductor wafer'],[/\b(nang luong|energy)\b/,'electric power infrastructure']];
 return topics.find(([re])=>re.test(t))?.[1]||null;
}
export function commonsAsset(page,query){
 const info=page.imageinfo?.[0],m=info?.extmetadata||{};if(!info)return null;
 const license=clean(m.LicenseShortName?.value),licenseUrl=m.LicenseUrl?.value||'';
 if(!((license==='CC0'&&/^https:\/\/creativecommons.org\/publicdomain\/zero\/1\.0\/?$/.test(licenseUrl))||license==='Public domain'))return null;
 if(m.Copyrighted?.value==='True'||m.Restrictions?.value)return null;
 const url=info.thumburl||info.url;
 try{if(new URL(url).hostname!=='upload.wikimedia.org'||new URL(url).protocol!=='https:')return null;}catch{return null;}
 const hay=normalized(page.title+' '+clean(m.ImageDescription?.value));
 if(!query.split(' ').some(w=>w.length>3&&hay.includes(w)))return null;
 if(!/^image\/(jpeg|png|webp)$/.test(info.mime||''))return null;
 if(!info.descriptionurl?.startsWith('https://commons.wikimedia.org/wiki/File:'))return null;
 return {url,sourcePage:info.descriptionurl,license,licenseUrl,author:clean(m.Artist?.value),title:clean(page.title),description:clean(m.ImageDescription?.value).slice(0,500),purpose:'Ảnh minh họa chủ đề, không phải bằng chứng sự kiện',query};
}
async function limited(r,max){if(!r.ok)throw Error('HTTP '+r.status);const reader=r.body.getReader(),chunks=[];let n=0;for(;;){const x=await reader.read();if(x.done)break;n+=x.value.length;if(n>max){await reader.cancel();throw Error('Media too large');}chunks.push(Buffer.from(x.value));}return Buffer.concat(chunks);}
export async function licensedImages(config,job){
 const archive=path.join(config.appRoot,'teleSetup','.bridge','media',job.id);
 if(!/^v\d+$/.test(job.id))throw Error('Invalid job ID');
 fs.mkdirSync(archive,{recursive:true});
 const manifest={job:job.id,article:job.url,created:new Date().toISOString(),assets:[],notice:'Video tin ưu tiên ảnh công khai từ bài nguồn theo yêu cầu chủ bot; không suy ra quyền tái sử dụng từ việc ảnh có trên mạng. Nguồn và trạng thái quyền của từng ảnh được lưu riêng; cần duyệt trước khi đăng.'};
 const query=imageQuery(job);let candidates=[];
 try{
  for(const {bytes,mime,...asset} of await articleImages(config,job)){
   const upload=await fetch(config.studio+'/api/user-images?name=article-'+job.id,{method:'POST',headers:{'Content-Type':mime},body:bytes,signal:AbortSignal.timeout(12000)});
   if(!upload.ok)continue;const result=await upload.json();if(!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(result.id||''))continue;
   const sha256=crypto.createHash('sha256').update(bytes).digest('hex');fs.writeFileSync(path.join(archive,result.id),bytes);manifest.assets.push({...asset,id:result.id,sha256,retrieved:new Date().toISOString()});
  }
 }catch{manifest.articleImageError='Không lấy được ảnh công khai từ bài báo; dùng nguồn dự phòng.';}
 try{
  if(manifest.assets.length<2)
  for(const {bytes,mime,...asset} of await driveImages(config,job)){
   if(manifest.assets.length>=2)break;
   const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
   if(manifest.assets.some(a=>a.sha256===sha256))continue;
   const upload=await fetch(config.studio+'/api/user-images?name=drive-'+job.id,{method:'POST',headers:{'Content-Type':mime},body:bytes,signal:AbortSignal.timeout(12000)});
   if(!upload.ok)continue;const result=await upload.json();
   if(!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(result.id||''))continue;
   fs.writeFileSync(path.join(archive,result.id),bytes);
   manifest.assets.push({...asset,id:result.id,sha256,retrieved:new Date().toISOString()});
  }
 }catch{manifest.driveError='Không đọc được thư viện Drive; kiểm tra đường dẫn, quyền đọc và cấu hình riêng trên máy.';}
 try{
  if(query&&manifest.assets.length<2){
   const u=new URL('https://commons.wikimedia.org/w/api.php');u.search=new URLSearchParams({action:'query',format:'json',generator:'search',gsrsearch:query+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'12',prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'1280'});
   const r=await fetch(u,{headers:{'User-Agent':'NewsAutoBear/1.0 (personal licensed image search)'},signal:AbortSignal.timeout(12000)});const data=JSON.parse((await limited(r,1500000)).toString('utf8'));
   candidates=Object.values(data.query?.pages||{}).map(p=>commonsAsset(p,query)).filter(Boolean);
  }
  // Article images require an explicit exact-URL permission record; never infer permission from og:image.
  const permissionFile=path.join(config.appRoot,'teleSetup','.bridge','article-image-permissions.json');
  if(fs.existsSync(permissionFile))for(const p of JSON.parse(fs.readFileSync(permissionFile,'utf8'))){
   if(p.article===job.url&&p.authorized===true&&p.permissionEvidence&&/^https:\/\//.test(p.url)&&p.author){
    // Host must be explicitly recorded locally, never read as a fetch instruction from the article.
    if(new URL(p.url).hostname!==p.allowedHost)continue;
    candidates.unshift({url:p.url,sourcePage:p.article,license:'Permission recorded by owner',author:p.author,permissionEvidence:p.permissionEvidence,purpose:'Ảnh bài báo được ghi nhận quyền sử dụng'});
   }
  }
  for(const a of candidates.slice(0,6)){
   if(manifest.assets.length>=2)break;
   try{
    const r=await fetch(a.url,{redirect:'error',signal:AbortSignal.timeout(15000)});
    if(!/^image\/(jpeg|png|webp)(;|$)/.test(r.headers.get('content-type')||'')){await r.body?.cancel();continue;}
    const bytes=await limited(r,6000000),mime=r.headers.get('content-type').split(';')[0];
    if(!(bytes[0]===255&&bytes[1]===216||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'))continue;
    const upload=await fetch(config.studio+'/api/user-images?name=news-'+job.id,{method:'POST',headers:{'Content-Type':mime},body:bytes,signal:AbortSignal.timeout(12000)});
    if(!upload.ok)continue;const result=await upload.json();
    if(!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(result.id||''))continue;
    const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
    fs.writeFileSync(path.join(archive,result.id),bytes);
    manifest.assets.push({...a,id:result.id,sha256,retrieved:new Date().toISOString()});
   }catch{/* Leave the scene empty rather than download an unlicensed substitute. */}
  }
 }catch(err){manifest.error='Không lấy được ảnh có giấy phép: '+err.message;}
 if(manifest.assets.length===0){
  for(let variant=0;variant<2;variant++)try{
   const {bytes,plan}=await drawSketch(job,archive,variant);
   const upload=await fetch(config.studio+'/api/user-images?name=sketch-'+job.id+'-'+variant,{method:'POST',headers:{'Content-Type':'image/png'},body:bytes,signal:AbortSignal.timeout(12000)});
   if(!upload.ok)throw Error('Studio upload HTTP '+upload.status);const result=await upload.json();
   if(!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(result.id||''))throw Error('Invalid upload ID');
   const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
   fs.writeFileSync(path.join(archive,result.id),bytes);
   manifest.assets.push({id:result.id,sha256,title:plan.heading,author:'NewsAutoBear — vẽ bằng chương trình trên máy',license:'Local procedural sketch',sourcePage:job.url,purpose:'Phác họa minh họa, không phải ảnh sự kiện',theme:plan.theme,forecast:plan.forecast,retrieved:new Date().toISOString()});
  }catch(err){manifest.sketchError='Không tạo được phác họa: '+err.message;}
 }
 fs.writeFileSync(path.join(archive,'manifest.json'),JSON.stringify(manifest,null,2));return manifest;
}
