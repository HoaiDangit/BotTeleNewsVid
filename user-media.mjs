import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {imageMime,readLimited} from './drive-images.mjs';import {createRequire} from 'node:module';import {spawn} from 'node:child_process';
export async function suppliedImages(config,job,archive){
 const media=JSON.parse(job.payload||'{}').media||[],result={assets:[],thumbnail:null};
 for(let index=0;index<Math.min(media.length,4);index++){
  const item=media[index],r=await fetch(config.cloud+'/render/media',{method:'POST',headers:{Authorization:'Bearer '+config.token,'Content-Type':'application/json','X-Job-Id':job.id},body:JSON.stringify({index}),signal:AbortSignal.timeout(25000)});
  const bytes=await readLimited(r),mime=imageMime(bytes);if(!mime)throw Error('Ảnh người dùng không đúng định dạng');
  const ext=mime==='image/jpeg'?'jpg':mime.split('/')[1],file=path.join(archive,'user-'+index+'.'+ext);fs.writeFileSync(file,bytes);
  if(item.role!=='illustration'&&!result.thumbnail)result.thumbnail=file;
  if(item.role==='thumbnail'||result.assets.length>=2)continue;
  const upload=await fetch(config.studio+'/api/user-images?name=user-'+job.id+'-'+index,{method:'POST',headers:{'Content-Type':mime},body:bytes,signal:AbortSignal.timeout(12000)});if(!upload.ok)throw Error('Studio chưa nhận ảnh người dùng');const data=await upload.json();if(!/^[\w-]+\.(png|jpe?g|webp)$/.test(data.id||''))throw Error('Invalid user image ID');fs.writeFileSync(path.join(archive,data.id),bytes);
  result.assets.push({id:data.id,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),title:'Ảnh/screenshot người dùng cung cấp',provider:'user',license:'User-provided; rights not independently verified',author:'Người dùng cung cấp',sourcePage:job.url,purpose:'Ảnh minh họa do người gửi chọn'});
 }
 return result;
}
export async function makeThumbnail(appRoot,input,output){
 const require=createRequire(path.join(appRoot,'package.json')),ffmpeg=require('ffmpeg-static');
 await new Promise((resolve,reject)=>{const child=spawn(ffmpeg,['-y','-i',input,'-frames:v','1','-vf','scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x101820','-q:v','5',output],{windowsHide:true,stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code?reject(Error('Không chuẩn bị được ảnh thumb')):resolve());});
 if(fs.statSync(output).size>2000000)throw Error('Ảnh thumb quá lớn');return output;
}
