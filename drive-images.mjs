import fs from 'node:fs';
import path from 'node:path';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const id=s=>/^[a-zA-Z0-9_-]{6,160}$/.test(s||'');
export function imageMime(bytes){
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'image/webp';
 return null;
}
export async function readLimited(response,max=6000000){
 if(!response.ok){await response.body?.cancel();throw Error('Drive HTTP '+response.status);}
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw Error('Drive image exceeds size limit');chunks.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});}
 return Buffer.concat(chunks);
}
export function readDriveConfig(appRoot){
 const filename=path.join(appRoot,'teleSetup','.bridge','drive-images.json');
 if(!fs.existsSync(filename))return null;
 const c=JSON.parse(fs.readFileSync(filename,'utf8'));if(!c.enabled)return null;
 if(!['synced','api'].includes(c.mode)||!Array.isArray(c.folders)||c.folders.length>40)throw Error('Invalid Drive image configuration');
 return c;
}
export function folderScore(folder,job){
 if(folder.authorized!==true||!folder.permissionEvidence||!folder.author)return 0;
 const text=' '+norm([job.title,job.excerpt,job.category].join(' '))+' ';
 return [...new Set((folder.keywords||[]).map(norm).filter(Boolean))].reduce((n,k)=>n+(text.includes(' '+k+' ')?k.split(' ').length:0),0);
}
export function libraryFolders(config){
 if(config.mode!=='synced')return config.folders;
 return config.folders.flatMap(folder=>{
  if(!folder.exerciseLibrary)return [folder];
  if(!path.isAbsolute(folder.localPath||''))throw Error('Exercise library root must be absolute');
  return fs.readdirSync(folder.localPath,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.isSymbolicLink()&&!/^[._]/.test(e.name)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,300).map(e=>({...folder,exerciseLibrary:false,exerciseName:e.name,localPath:path.join(folder.localPath,e.name),recursive:false,keywords:[...(folder.keywords||[]),e.name]}));
 });
}
export function syncedFiles(root,{recursive=false}={}){
 const files=[],queue=[{dir:root,depth:0}];let visited=0;
 while(queue.length&&visited++<80&&files.length<500){
  const {dir,depth}=queue.shift();
  for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
   if(entry.isSymbolicLink())continue;
   const localPath=path.join(dir,entry.name);
   if(entry.isDirectory()&&recursive&&depth<2&&queue.length<80)queue.push({dir:localPath,depth:depth+1});
   if(entry.isFile()&&/\.(png|jpe?g|webp)$/i.test(entry.name))files.push({name:entry.name,description:path.relative(root,dir),localPath});
   if(files.length>=500)break;
  }
 }
 return files;
}
async function apiToken(c,appRoot,fetcher){
 // Credentials are provisioned by the owner locally; never derive them from browser sessions.
 const p=path.join(appRoot,'teleSetup','.bridge','drive-oauth.json');
 const a=JSON.parse(fs.readFileSync(p,'utf8'));
 if(!a.client_id||!a.client_secret||!a.refresh_token)throw Error('Drive OAuth credentials missing');
 const r=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:a.client_id,client_secret:a.client_secret,refresh_token:a.refresh_token,grant_type:'refresh_token'}),signal:AbortSignal.timeout(15000)});
 const j=JSON.parse((await readLimited(r,100000)).toString());if(typeof j.access_token!=='string')throw Error('Drive OAuth token unavailable');return j.access_token;
}
export async function driveImages(config,job,{fetcher=fetch}={}){
 const c=readDriveConfig(config.appRoot);if(!c)return [];
 const workout=job.kind==='workout'?JSON.parse(job.excerpt):null;
 const exerciseTerms=workout?[workout.title,...(workout.aliases||[])].map(norm).filter(t=>t.length>3):[];
 const folders=libraryFolders(c).map(folder=>{
  if(folder.authorized!==true||!folder.author||!folder.permissionEvidence)return {folder,score:0};
  const name=' '+norm(folder.exerciseName)+' ',exact=exerciseTerms.some(t=>name.includes(' '+t+' '));
  return {folder,score:folderScore(folder,job)+(exact?100:0)||(job.kind==='workout'?1:0)};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,job.kind==='workout'?8:4);
 if(!folders.length)return [];
 const token=c.mode==='api'?await apiToken(c,config.appRoot,fetcher):null,assets=[];
 for(const {folder} of folders){
  let files=[];
  if(c.mode==='synced'){
   if(!path.isAbsolute(folder.localPath||''))throw Error('Drive sync folder must be absolute');
   const root=fs.realpathSync(folder.localPath);
   files=syncedFiles(root,folder);
  }else{
   if(!id(folder.folderId))throw Error('Invalid Drive folder ID');
   let pageToken='';
   for(let page=0;page<5;page++){
    const u=new URL('https://www.googleapis.com/drive/v3/files');u.search=new URLSearchParams({q:"'"+folder.folderId+"' in parents and trashed = false and (mimeType = 'image/jpeg' or mimeType = 'image/png' or mimeType = 'image/webp')",fields:'nextPageToken,files(id,name,mimeType,size,description,capabilities(canDownload))',pageSize:'100',orderBy:'name',supportsAllDrives:'true',includeItemsFromAllDrives:'true',...(pageToken?{pageToken}:{})});
    const r=await fetcher(u,{redirect:'error',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
    const data=JSON.parse((await readLimited(r,1500000)).toString());files.push(...(data.files||[]).filter(f=>id(f.id)&&f.capabilities?.canDownload===true&&Number(f.size)>0&&Number(f.size)<=6000000));
    pageToken=data.nextPageToken;if(!pageToken)break;
   }
  }
  if(job.kind==='workout'){
   const workout=JSON.parse(job.excerpt),terms=[workout.title,...(workout.aliases||[])].map(norm).filter(t=>t.length>3);
   files=files.filter(f=>terms.some(t=>(' '+norm(f.name+' '+(f.description||''))+' ').includes(' '+t+' ')));
  }
  const text=norm([job.title,job.excerpt].join(' ')).split(' ').filter(w=>w.length>3);
  const jobText=' '+norm([job.title,job.excerpt].join(' '))+' ';
  const rank=f=>text.filter(w=>(' '+norm(f.name+' '+(f.description||''))+' ').includes(' '+w+' ')).length+(f.description&&jobText.includes(' '+norm(f.description)+' ')?20:0);
  files.sort((a,b)=>rank(b)-rank(a)||a.name.localeCompare(b.name));
  for(const file of files.slice(0,8)){
   if(assets.length===2)return assets;
   try{
    let bytes;
    if(c.mode==='synced'){
     // Reject replacement symlinks as well as directory links outside the selected folder.
     const stat=fs.lstatSync(file.localPath);if(stat.isSymbolicLink()||!stat.isFile()||stat.size>6000000)continue;
     const fd=fs.openSync(file.localPath,'r');try{if(fs.fstatSync(fd).size>6000000)continue;bytes=fs.readFileSync(fd);}finally{fs.closeSync(fd);}
    }else{
     bytes=await readLimited(await fetcher('https://www.googleapis.com/drive/v3/files/'+file.id+'?alt=media&supportsAllDrives=true',{redirect:'error',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)}));
    }
    const mime=imageMime(bytes);if(!mime)continue;
    assets.push({bytes,mime,title:file.name,sourcePage:file.id?'https://drive.google.com/file/d/'+file.id+'/view':folder.sourcePage||'Google Drive synced library',license:'Permission recorded by owner',author:folder.author,permissionEvidence:folder.permissionEvidence,provider:'google-drive',exercise:folder.exerciseName||null,purpose:'Ảnh thư viện minh họa chủ đề, không phải bằng chứng sự kiện'});
   }catch{/* Try the next image; the caller retains other image sources. */}
  }
 }
 return assets;
}
