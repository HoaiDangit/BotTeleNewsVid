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
 const folders=c.folders.map(folder=>({folder,score:folderScore(folder,job)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4);
 if(!folders.length)return [];
 const token=c.mode==='api'?await apiToken(c,config.appRoot,fetcher):null,assets=[];
 for(const {folder} of folders){
  let files=[];
  if(c.mode==='synced'){
   if(!path.isAbsolute(folder.localPath||''))throw Error('Drive sync folder must be absolute');
   const root=fs.realpathSync(folder.localPath);
   files=fs.readdirSync(root,{withFileTypes:true}).filter(x=>x.isFile()&&!x.isSymbolicLink()&&/\.(png|jpe?g|webp)$/i.test(x.name)).slice(0,500).map(x=>({name:x.name,localPath:path.join(root,x.name)}));
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
  const text=norm([job.title,job.excerpt].join(' ')).split(' ').filter(w=>w.length>3);
  const rank=f=>text.filter(w=>(' '+norm(f.name+' '+(f.description||''))+' ').includes(' '+w+' ')).length;
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
    assets.push({bytes,mime,title:file.name,sourcePage:file.id?'https://drive.google.com/file/d/'+file.id+'/view':folder.sourcePage||'Google Drive synced library',license:'Permission recorded by owner',author:folder.author,permissionEvidence:folder.permissionEvidence,provider:'google-drive',purpose:'Ảnh thư viện minh họa chủ đề, không phải bằng chứng sự kiện'});
   }catch{/* Try the next image; the caller retains other image sources. */}
  }
 }
 return assets;
}
