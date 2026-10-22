import fs from 'node:fs';
import {licensedImages} from './licensed-images.mjs';
import {pidAlive,agentAlive} from './runtime-status.mjs';
import {editorialRequest,saveReview,POLICY_VERSION} from './editorial-policy.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {setTimeout as sleep} from 'node:timers/promises';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const PRIVATE=path.join(ROOT,'.bridge');
const CONFIG=path.join(PRIVATE,'config.json');
const JOURNAL=path.join(PRIVATE,'current.json');
const log=s=>console.log(new Date().toISOString()+' '+s);
const save=data=>{fs.writeFileSync(JOURNAL+'.tmp',JSON.stringify(data,null,2));fs.renameSync(JOURNAL+'.tmp',JOURNAL);};
export function filename(title,time) {
  const base=String(title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)||'ban-tin';
  return base+'__'+new Date(time+7*3600000).toISOString().slice(0,19).replace('T','_').replace(/:/g,'-')+'.mp4';
}
export function outputPath(appRoot,slug) {
  if(!/^[a-zA-Z0-9_-]+$/.test(slug||''))throw Error('Slug video không hợp lệ');
  return path.join(appRoot,'videos',slug,'output','video.mp4');
}
export async function studioSnapshot(studio) {
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
  try {
    const r=await fetch(studio+'/api/progress',{signal:controller.signal});
    if(!r.ok)throw Error('Không đọc được tiến độ');
    const reader=r.body.getReader(),decoder=new TextDecoder();let text='';
    try{while(text.length<2000000){const next=await reader.read();if(next.done)break;text+=decoder.decode(next.value,{stream:true});const match=text.match(/^data: ([^\r\n]+)\r?\n/m);if(match)return JSON.parse(match[1]);}throw Error('Tiến độ không hợp lệ');}
    finally{await reader.cancel().catch(()=>{});}
  }finally{clearTimeout(timer);controller.abort();}
}
async function cloud(config,route,{body={},job,raw}={}) {
  const headers={Authorization:'Bearer '+config.token};
  if(job)headers['X-Job-Id']=job;
  if(raw){headers['Content-Type']='video/mp4';headers['Content-Length']=String(fs.statSync(raw).size);}
  else headers['Content-Type']='application/json';
  const r=await fetch(config.cloud+'/render/'+route,{method:route==='ping'?'GET':'POST',headers,
    ...(route==='ping'?{}:{body:raw?fs.createReadStream(raw):JSON.stringify(body)}),duplex:'half',signal:AbortSignal.timeout(raw?240000:20000)});
  const result=await r.json();if(!r.ok)throw Error('Cloud '+r.status+(result.error?': '+result.error:''));return result;
}
export async function ensureStudio(config) {
  try{await studioSnapshot(config.studio);return;}catch{}
  const entry=path.join(config.appRoot,'scripts','ui-server.mjs');
  if(!fs.existsSync(entry))throw Error('Không thấy ứng dụng dựng video');
  const fd=fs.openSync(path.join(PRIVATE,'studio.log'),'a');
  const child=spawn(process.execPath,[entry],{cwd:config.appRoot,windowsHide:true,detached:true,stdio:['ignore',fd,fd]});
  child.on('error',()=>{});child.unref();fs.closeSync(fd);
  for(let i=0;i<15;i++){await sleep(1000);try{await studioSnapshot(config.studio);return;}catch{}}
  throw Error('Ứng dụng chưa khởi động được; xem studio.log trên máy');
}
function run(cmd,args) {
  return new Promise((resolve,reject)=>{const p=spawn(cmd,args,{windowsHide:true,stdio:['ignore','ignore','pipe']});let diagnostic='';
    p.stderr.on('data',x=>{diagnostic=(diagnostic+x).slice(-12000);});p.on('error',()=>reject(Error('Không chạy được FFmpeg')));
    p.on('exit',code=>resolve({code,diagnostic}));});
}
async function prepareUpload(config,state,source) {
  const dir=path.join(config.appRoot,'videos','telegram',state.job.id);fs.mkdirSync(dir,{recursive:true});
  const target=path.join(dir,filename(state.job.title,state.completed));
  if(!fs.existsSync(target))fs.copyFileSync(source,target);
  state.original=target;save(state);
  if(fs.statSync(target).size<=48000000)return target;
  const require=createRequire(path.join(config.appRoot,'package.json')),ffmpeg=require('ffmpeg-static');
  const probe=await run(ffmpeg,['-hide_banner','-i',target]);
  const match=probe.diagnostic.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  if(!match)throw Error('Video lớn: không đọc được thời lượng để nén');
  const seconds=Number(match[1])*3600+Number(match[2])*60+Number(match[3]);
  const kbps=Math.floor(45000000*8/seconds/1000)-96;
  if(kbps<150)throw Error('Video quá dài để gửi Telegram; bản gốc đã lưu trên máy');
  const small=target.replace(/\.mp4$/,'__telegram.mp4');
  const result=await run(ffmpeg,['-y','-i',target,'-map','0:v:0','-map','0:a?','-vf',"scale='min(1280,iw)':-2",'-c:v','libx264','-preset','fast','-b:v',kbps+'k','-maxrate',kbps+'k','-bufsize',(kbps*2)+'k','-c:a','aac','-b:a','96k','-movflags','+faststart',small]);
  if(result.code||fs.statSync(small).size>49000000)throw Error('Chưa nén được dưới giới hạn Telegram; bản gốc đã lưu trên máy');
  return small;
}
async function processJob(config,job,resume) {
  let state=fs.existsSync(JOURNAL)?JSON.parse(fs.readFileSync(JOURNAL,'utf8')):null;
  if(resume&&(!state||state.job.id!==job.id)){
    if(job.status==='uploading'){log('Gửi video chưa xác nhận: '+job.id+'; cần kiểm tra Telegram.');return;}
    await cloud(config,'fail',{job:job.id,body:{error:'Phiên dựng trước bị gián đoạn; vui lòng gửi lại /video sau khi kiểm tra ứng dụng.'}});return;
  }
  if(!resume){state={job,phase:'starting',marker:'[NewsAutoBear '+job.id+']'};save(state);
    state.editorialPolicy=POLICY_VERSION;save(state);
    state.media=await licensedImages(config,job);save(state);
    const r=await fetch(config.studio+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(editorialRequest(job,state.marker,state.media)),signal:AbortSignal.timeout(30000)});
    if(!r.ok)throw Error('Ứng dụng chưa nhận yêu cầu (HTTP '+r.status+')');
    state.phase='rendering';save(state);log('Đang dựng '+job.id);
  }
  if(state.phase==='starting')throw Error('Khởi tạo bị gián đoạn; cần kiểm tra ứng dụng trước khi tạo lại');
  if(state.phase==='uploading'){
    const result=await cloud(config,'status',{job:job.id});
    if(result.job.status==='done'){state.phase='done';save(state);return;}
    if(result.job.status==='running'){state.phase='ready';save(state);}
    else{log('Không tự gửi lại '+job.id+' vì lượt gửi trước chưa xác nhận.');return;}
  }
  while(state.phase==='rendering') {
    const p=await studioSnapshot(config.studio);
    // Correlate with the job marker in the application's initial log. Never send another UI job's video.
    const ours=JSON.stringify(p.logs||[]).includes(state.marker);
    if(!ours)throw Error('Ứng dụng đang ở phiên khác; dừng để tránh gửi nhầm video');
    if(p.step==='error')throw Error('Ứng dụng báo lỗi dựng; xem chi tiết trong KT AI Video Studio');
    if(p.step==='completed'&&p.outputVideo){state.source=outputPath(config.appRoot,p.outputVideo.slug);state.completed=Date.now();state.phase='ready';save(state);break;}
    if(!p.active)throw Error('Phiên dựng đã dừng trước khi hoàn tất');
    await cloud(config,'progress',{job:job.id,body:{progress:String(p.step)+' · '+(p.progress||0)+'%'}}).catch(()=>{});
    await sleep(10000);
  }
  if(state.phase==='ready'){
    if(state.editorialPolicy!==POLICY_VERSION)throw Error('Video dựng theo chính sách cũ; cần duyệt thủ công trước khi gửi.');
    saveReview(config.appRoot,state);
    const upload=await prepareUpload(config,state,state.source);
    state.phase='uploading';save(state);
    const sent=await cloud(config,'upload',{job:job.id,raw:upload});
    state.phase='done';state.telegram=sent;save(state);
    // Keep the full-quality original under the same article + timestamp name as Telegram.
    const renamed=path.join(path.dirname(state.original),sent.filename);
    if(renamed!==state.original&&!fs.existsSync(renamed))fs.renameSync(state.original,renamed);
    state.original=renamed;save(state);log('Đã gửi '+job.id+' về cuộc trò chuyện yêu cầu.');
  }
}
async function main() {
  const config=JSON.parse(fs.readFileSync(CONFIG,'utf8'));
  if(!/^https:\/\/[^/]+\.workers\.dev$/.test(config.cloud)||config.studio!=='http://127.0.0.1:4000')throw Error('Địa chỉ cấu hình không hợp lệ');
  if(process.argv.includes('--check')){const status=await cloud(config,'ping');log(JSON.stringify(status));await ensureStudio(config);const p=await studioSnapshot(config.studio);log('Studio reachable; active='+!!p.active);return;}
  const previousFile=path.join(PRIVATE,'previous-runtime.txt');
  if(fs.existsSync(previousFile)){
    const previousLock=path.join(fs.readFileSync(previousFile,'utf8').replace(/^\uFEFF/,'').trim(),'agent.pid');
    if(fs.existsSync(previousLock)){
      const previousPid=Number(fs.readFileSync(previousLock,'utf8'));
      if(Number.isInteger(previousPid)&&previousPid>0){
        if(agentAlive(path.dirname(previousLock)))throw Error('Cầu nối ổ C vẫn chạy. Không khởi động bản thứ hai.');
      }
    }
  }
  // One local renderer process only, including accidental double-clicks of the launcher.
  const lock=path.join(PRIVATE,'agent.pid');
  if(fs.existsSync(lock)){const pid=Number(fs.readFileSync(lock,'utf8'));if(agentAlive(PRIVATE))throw Error('Agent đã chạy');}
  if(fs.existsSync(lock))fs.unlinkSync(lock);
  fs.writeFileSync(lock,String(process.pid),{flag:'wx'});
  process.on('exit',()=>{try{if(Number(fs.readFileSync(lock,'utf8'))===process.pid)fs.unlinkSync(lock);}catch{}});
  const heartbeatFile=path.join(PRIVATE,'agent-heartbeat.json');
  const pulse=()=>{try{fs.writeFileSync(heartbeatFile,JSON.stringify({pid:process.pid,seen:Date.now()}));}catch{}};
  pulse();const pulseTimer=setInterval(pulse,15000);pulseTimer.unref();
  process.on('exit',()=>{try{if(JSON.parse(fs.readFileSync(heartbeatFile,'utf8')).pid===process.pid)fs.unlinkSync(heartbeatFile);}catch{}});
  log('NewsAutoBear video agent started');
  while(true){
    try{
      await ensureStudio(config);
      const status=await cloud(config,'ping');if(!status.ownerPaired){log('Chờ ghép nối chủ bot Telegram.');await sleep(30000);continue;}
      const snapshot=await studioSnapshot(config.studio);
      const local=fs.existsSync(JOURNAL)?JSON.parse(fs.readFileSync(JOURNAL,'utf8')):null;
      if(snapshot.active&&(!local||!JSON.stringify(snapshot.logs||[]).includes(local.marker))){await sleep(15000);continue;}
      const {job,resume}=await cloud(config,'claim');
      if(job){try{await processJob(config,job,resume);}catch{
        const s=fs.existsSync(JOURNAL)?JSON.parse(fs.readFileSync(JOURNAL,'utf8')):null;
        if(s?.job.id===job.id&&s.phase==='uploading')log('Lượt gửi '+job.id+' chưa xác nhận; giữ bản trên máy.');
        else if(s?.phase==='rendering'&&(await studioSnapshot(config.studio).catch(()=>null))?.active)log('Mất kết nối tạm thời; giữ phiên dựng '+job.id);
        else await cloud(config,'fail',{job:job.id,body:{error:'Không hoàn tất được; kiểm tra ứng dụng và thư mục videos/telegram trên máy trước khi gửi lại.'}}).catch(()=>{});
      }}
    }catch{log('Chưa kết nối được; tự thử lại sau 30 giây.');}
    await sleep(30000);
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(err=>{console.error(err.message);process.exitCode=1;});
