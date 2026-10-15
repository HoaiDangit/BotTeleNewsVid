import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
export function pidAlive(pid){
 if(!Number.isSafeInteger(pid)||pid<=0)return false;
 if(process.platform==='win32'){
  const r=spawnSync('powershell.exe',['-NoProfile','-Command',"$p=Get-Process -Id "+pid+" -ErrorAction SilentlyContinue; if ($p -and $p.ProcessName -eq 'node') { exit 0 } else { exit 1 }"],{encoding:'utf8',windowsHide:true,timeout:5000});
  if(r.error||![0,1].includes(r.status))throw Error('Không kiểm tra được tiến trình Windows; không khởi động trùng.');
  return r.status===0;
 }
 try{process.kill(pid,0);return true;}catch(e){if(e.code==='ESRCH')return false;throw e;}
}
export function heartbeatLabel(seen,now=Date.now()){
 const age=now-Number(seen||0);
 return seen&&age>=0&&age<120000?'ĐANG KẾT NỐI (heartbeat dưới 2 phút)':'CHƯA KẾT NỐI (chưa có heartbeat mới)';
}

export function agentAlive(folder){
 try{const lease=JSON.parse(fs.readFileSync(path.join(folder,'agent-heartbeat.json'),'utf8'));const age=Date.now()-lease.seen;if(age>=0&&age<45000)return true;}catch{}
 const lock=path.join(folder,'agent.pid');return fs.existsSync(lock)&&pidAlive(Number(fs.readFileSync(lock,'utf8')));
}
