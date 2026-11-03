import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';import {setTimeout as sleep} from 'node:timers/promises';import {agentAlive} from './runtime-status.mjs';import {appendEvent,redactError} from './video-observer.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),priv=path.join(root,'.bridge'),runtime=path.join(priv,'runtime-v3'),events=path.join(priv,'watchdog-events.jsonl');
fs.mkdirSync(priv,{recursive:true});
appendEvent(events,{event:'watchdog_started',pid:process.pid});
while(true){
 try{
  fs.writeFileSync(path.join(priv,'watchdog-heartbeat.json'),JSON.stringify({pid:process.pid,seen:Date.now()}));
  if(!fs.existsSync(path.join(priv,'watchdog-paused'))&&!agentAlive(runtime)){
   appendEvent(events,{event:'bridge_missing_restart'});
   const result=spawnSync(process.execPath,[path.join(root,'launcher-status.mjs'),'--start'],{cwd:root,windowsHide:true,encoding:'utf8',timeout:45000});
   appendEvent(events,{event:result.status===0?'bridge_restarted':'restart_failed',code:result.status,error:result.status===0?undefined:redactError(result.stderr||result.error||result.stdout)});
  }
 }catch(error){appendEvent(events,{event:'watchdog_error',error:redactError(error)});}
 await sleep(30000);
}
