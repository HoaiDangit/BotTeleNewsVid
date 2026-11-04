import fs from 'node:fs';import crypto from 'node:crypto';
export function safeError(error){return String(error?.message||error||'Lỗi không rõ')+(error?.cause?.code?' ['+error.cause.code+']':'');}
export function redactError(error){return safeError(error).replace(/Bearer\s+\S+/gi,'Bearer [ẩn]').replace(/bot\d+:[\w-]+/g,'bot[ẩn]').replace(/AIza[\w-]{20,}/g,'[API key ẩn]').replace(/([?&](?:key|token|api_key)=)[^&\s]+/gi,'$1[ẩn]').slice(0,600);}
export function observeJob(state,snapshot,now=Date.now()){
 state.startedAt=state.startedAt||state.job.started||now;
 const signature=crypto.createHash('sha256').update(JSON.stringify([snapshot.step,snapshot.progress,(snapshot.logs||[]).slice(-3)])).digest('hex');
 if(state.activitySignature!==signature){state.activitySignature=signature;state.lastActivityAt=now;}
 state.stage=String(snapshot.step||'unknown');state.lastObservedAt=now;
 return {progress:state.stage+' · '+(snapshot.progress||0)+'%',elapsedMs:now-state.startedAt,stalledMs:now-(state.lastActivityAt||now)};
}
export function appendEvent(file,event){try{if(fs.existsSync(file)&&fs.statSync(file).size>5000000)fs.renameSync(file,file+'.previous');fs.appendFileSync(file,JSON.stringify({time:new Date().toISOString(),...event})+'\n');}catch{}}
export function recoveryDecision(state,snapshot){
 if(!snapshot)return 'wait';
 const ours=JSON.stringify(snapshot.logs||[]).includes(state.marker);
 if(ours&&snapshot.step==='completed'&&/^[a-zA-Z0-9_-]+$/.test(snapshot.outputVideo?.slug||''))return 'ready';
 if(snapshot.active&&snapshot.step!=='error')return 'wait';
 return 'failed';
}
