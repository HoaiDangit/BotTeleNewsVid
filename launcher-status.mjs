import fs from 'node:fs';
import {runtimeFingerprint,RUNTIME_VERSION} from './runtime-version.mjs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawn} from 'node:child_process';import {setTimeout as sleep} from 'node:timers/promises';
import {studioSnapshot,ensureStudio} from './video-agent.mjs';import {pidAlive,heartbeatLabel,agentAlive} from './runtime-status.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),priv=path.join(root,'.bridge');
const c=JSON.parse(fs.readFileSync(path.join(priv,'config.json'),'utf8'));
function agentRunning(){const folder=path.join(priv,'runtime-v3');return agentAlive(folder)?folder:null;}

async function status(){
 let studio='CHƯA CHẠY',cloud='CHƯA KIỂM TRA',heartbeat='CHƯA KIỂM TRA';
 try{const p=await studioSnapshot(c.studio);studio=p.active?'ĐANG DỰNG VIDEO':p.step==='error'?'ĐANG MỞ — lỗi lượt dựng trước: '+String(p.error||'Xem nhật ký').slice(0,300):'SẴN SÀNG';}catch{}
 try{const r=await fetch(c.cloud+'/render/ping',{headers:{Authorization:'Bearer '+c.token},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const j=await r.json();cloud=j.ownerPaired?'ĐÃ GHÉP TELEGRAM':'CHƯA GHÉP TELEGRAM';heartbeat=heartbeatLabel(j.agentSeen);}catch{cloud='KHÔNG KẾT NỐI ĐƯỢC';}
 const agent=agentRunning();let runtime='không xác định / phiên bản cũ';try{const lease=JSON.parse(fs.readFileSync(path.join(agent||priv,'agent-heartbeat.json'),'utf8'));runtime=lease.version+' · '+(lease.fingerprint===runtimeFingerprint()?'ĐÃ NẠP BẢN HIỆN TẠI':'CẦN KHỞI ĐỘNG LẠI');}catch{}
 console.log('Studio: '+studio+'\nTiến trình cầu nối: '+(agent?'ĐANG CHẠY':'CHƯA CHẠY')+'\nPhiên bản đã cài: '+RUNTIME_VERSION+'\nPhiên bản đang chạy: '+runtime+'\nCloudflare: '+cloud+'\nTelegram: '+heartbeat+'\n\n'+(agent?'Thư mục cầu nối: '+agent:'Bấm Khởi động để mở Studio và cầu nối.')+'\nCập nhật: '+new Date().toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}));
}
try{
 if(process.argv.includes('--start')){
  await ensureStudio(c);
  const runningFolder=agentRunning();
  if(runningFolder){
   let lease={};try{lease=JSON.parse(fs.readFileSync(path.join(runningFolder,'agent-heartbeat.json'),'utf8'));}catch{}
   if(lease.version!==RUNTIME_VERSION||lease.fingerprint!==runtimeFingerprint()){
    const state=await studioSnapshot(c.studio);if(state.active)throw Error('Đang dựng video; đợi hoàn tất rồi khởi động lại bản mới.');
    throw Error('Cầu nối cũ chưa nạp media-v3. Đóng cầu nối cũ rồi mở EXE tại ổ E; không chỉ cập nhật GitHub.');
   }
  }
  if(!runningFolder){
   const fd=fs.openSync(path.join(priv,'agent-dashboard.log'),'a');
   const child=spawn(process.execPath,[path.join(root,'video-agent.mjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',fd,fd]});
   await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();fs.closeSync(fd);
   await sleep(2000);if(!agentRunning())throw Error('Cầu nối đã thoát. Mở nhật ký agent-dashboard.log để xem lỗi.');
  }
 }
 await status();
}catch(e){console.error('KHỞI ĐỘNG CHƯA HOÀN TẤT: '+e.message);process.exitCode=1;}
