async function videoNotice(e,key,chat,text){
 const k='video_notice:'+key;const inserted=await sql(e,'INSERT OR IGNORE INTO state(k,v) VALUES(?,?)',k,JSON.stringify({chat:String(chat),text:String(text).slice(0,3500),sent:false,attempt:0})).run();if(!inserted.meta.changes)return;
 await flushVideoNotices(e);
}
async function flushVideoNotices(e,now=Date.now()){
 const rows=(await sql(e,"SELECT k,v FROM state WHERE k LIKE 'video_notice:%' AND json_extract(v,'$.sent')=0 LIMIT 8").all()).results;
 for(const row of rows){const n=JSON.parse(row.v);if(now-n.attempt<60000)continue;const lock=await sql(e,"UPDATE state SET v=json_set(v,'$.attempt',?) WHERE k=? AND json_extract(v,'$.sent')=0 AND json_extract(v,'$.attempt')=?",now,row.k,n.attempt).run();if(!lock.meta.changes)continue;n.attempt=now;
  if(n.chat!==await get(e,'owner')&&!await get(e,'access:'+n.chat)){n.sent=true;n.revoked=true;await put(e,row.k,JSON.stringify(n));continue;}
  try{await send(e,n.chat,n.text);n.sent=true;n.sentAt=Date.now();await put(e,row.k,JSON.stringify(n));}catch{console.error('video_notice_pending');}
 }
}
async function videoHealth(e,now=Date.now()){
 await initVideo(e);await flushVideoNotices(e,now);
 const owner=await get(e,'owner'),seen=Number(await get(e,'video_agent_seen')||0);if(!owner||!seen)return;
 const offline=await get(e,'video_offline');
 if(now-seen>180000&&!offline){
  const claim=await sql(e,"INSERT OR IGNORE INTO state(k,v) VALUES('video_offline',?)",String(now)).run();if(!claim.meta.changes)return;
  const rows=(await sql(e,"SELECT DISTINCT chat FROM video_jobs WHERE status IN ('queued','running','uploading')").all()).results;
  for(const chat of new Set([owner,...rows.map(r=>r.chat)]))await videoNotice(e,'offline:'+now+':'+chat,chat,'⚠️ Máy dựng video đã mất kết nối hơn 3 phút. Có thể app đã tắt, máy ngủ/tắt hoặc mất mạng. Các yêu cầu đang chờ được giữ lại; video đang dựng cần kiểm tra sau khi máy kết nối lại. /check_status xem trạng thái.');
 }else if(now-seen<=180000&&offline){
  const claim=await sql(e,"DELETE FROM state WHERE k='video_offline' AND v=?",offline).run();if(!claim.meta.changes)return;
  const rows=(await sql(e,"SELECT DISTINCT chat FROM video_jobs WHERE status IN ('queued','running','uploading')").all()).results;
  for(const chat of new Set([owner,...rows.map(r=>r.chat)]))await videoNotice(e,'online:'+offline+':'+chat,chat,'✅ Máy dựng video đã kết nối lại. Bot tiếp tục kiểm tra hàng đợi; lượt dựng bị gián đoạn sẽ được báo riêng.');
 }
}
async function videoHeartbeat(e,data,ctx){
 await put(e,'video_agent_seen',Date.now());await put(e,'video_runtime_status',JSON.stringify({seen:Date.now(),uptimeMs:Number(data.uptimeMs)||0,job:data.job||null,phase:String(data.phase||'idle').slice(0,40)}));ctx.waitUntil(videoHealth(e).catch(()=>console.error('video_health_check_pending')));return json({ok:true});
}
