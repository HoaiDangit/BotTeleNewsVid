import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawn} from 'node:child_process';import {setTimeout as sleep} from 'node:timers/promises';
import {studioSnapshot,ensureStudio} from './video-agent.mjs';import {pidAlive,heartbeatLabel,agentAlive} from './runtime-status.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),priv=path.join(root,'.bridge');
const c=JSON.parse(fs.readFileSync(path.join(priv,'config.json'),'utf8'));
function agentRunning(){
 for(const folder of [priv,...(fs.existsSync(path.join(priv,'previous-runtime.txt'))?[fs.readFileSync(path.join(priv,'previous-runtime.txt'),'utf8').replace(/^\uFEFF/,'').trim()]:[])]){
  const lock=path.join(folder,'agent.pid');if(agentAlive(folder))return folder;
 }return null;
}
async function status(){
 let studio='CHƯA CHẠY',cloud='CHƯA KIỂM TRA',heartbeat='CHƯA KIỂM TRA';
 try{const p=await studioSnapshot(c.studio);studio=p.active?'ĐANG DỰNG VIDEO':p.step==='error'?'ĐANG MỞ — lỗi lượt dựng trước: '+String(p.error||'Xem nhật ký').slice(0,300):'SẴN SÀNG';}catch{}
 try{const r=await fetch(c.cloud+'/render/ping',{headers:{Authorization:'Bearer '+c.token},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const j=await r.json();cloud=j.ownerPaired?'ĐÃ GHÉP TELEGRAM':'CHƯA GHÉP TELEGRAM';heartbeat=heartbeatLabel(j.agentSeen);}catch{cloud='KHÔNG KẾT NỐI ĐƯỢC';}
 const agent=agentRunning();
 console.log('Studio: '+studio+'\nTiến trình cầu nối: '+(agent?'ĐANG CHẠY':'CHƯA CHẠY')+'\nCloudflare: '+cloud+'\nTelegram: '+heartbeat+'\n\n'+(agent?'Thư mục cầu nối: '+agent:'Bấm Khởi động để mở Studio và cầu nối.')+'\nCập nhật: '+new Date().toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}));
}
try{
 if(process.argv.includes('--start')){
  await ensureStudio(c);
  if(!agentRunning()){
   const fd=fs.openSync(path.join(priv,'agent-dashboard.log'),'a');
   const child=spawn(process.execPath,[path.join(root,'video-agent.mjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',fd,fd]});
   await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();fs.closeSync(fd);
   await sleep(2000);if(!agentRunning())throw Error('Cầu nối đã thoát. Mở nhật ký agent-dashboard.log để xem lỗi.');
  }
 }
 await status();
}catch(e){console.error('KHỞI ĐỘNG CHƯA HOÀN TẤT: '+e.message);process.exitCode=1;}
