// Appended to worker.mjs by build-video.mjs. Uses its private DB/Telegram helpers.
const AGENT_SHA256 = '211db1a6d709600c11742511a7cdc93131c0dda05341a73ef5227844aad3dd25';
async function initVideo(e) {
  await e.DB.prepare(`CREATE TABLE IF NOT EXISTS video_jobs(
    id TEXT PRIMARY KEY, chat TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL,
    excerpt TEXT, created INTEGER NOT NULL, started INTEGER, finished INTEGER,
    status TEXT NOT NULL, progress TEXT, filename TEXT, message_id INTEGER,kind TEXT NOT NULL DEFAULT 'news')`).run();
  const columns=(await e.DB.prepare('PRAGMA table_info(video_jobs)').all()).results;
  if(!columns.some(c=>c.name==='kind'))try{await e.DB.prepare("ALTER TABLE video_jobs ADD COLUMN kind TEXT NOT NULL DEFAULT 'news'").run();}catch(err){const check=(await e.DB.prepare('PRAGMA table_info(video_jobs)').all()).results;if(!check.some(c=>c.name==='kind'))throw err;}
  if(!columns.some(c=>c.name==='payload'))try{await e.DB.prepare('ALTER TABLE video_jobs ADD COLUMN payload TEXT').run();}catch(err){const check=(await e.DB.prepare('PRAGMA table_info(video_jobs)').all()).results;if(!check.some(c=>c.name==='payload'))throw err;}
}
async function videoCommand(e,id,text,updateId,message={}) {
  await initVideo(e);
  if(['/video_status','/check_status'].includes(text.split(/\s/)[0].split('@')[0])) {
    const rows=(await sql(e,'SELECT id,title,status,progress,kind FROM video_jobs WHERE chat=? ORDER BY created DESC LIMIT 5',id).all()).results;
    const last=Number(await get(e,'video_agent_seen')||0);
    await send(e,id,'Máy dựng: '+(Date.now()-last<120000?'đang kết nối':'chưa kết nối hoặc đang tắt')+'\n'+(rows.map(r=>(r.kind==='workout'?'[BÀI TẬP] ':'[TIN TỨC] ')+r.id+' · '+r.status+' · '+r.title+'\n'+(r.progress||'')).join('\n\n')||'Chưa có yêu cầu video.'));return;
  }
  const raw=text.replace(/^\/video(?:_tin)?(?:@\w+)?\s*/, '').trim();
  if(!raw&&!(message.document&&(message.document.mime_type==='text/plain'||/\.txt$/i.test(message.document.file_name||'')))) {await send(e,id,'Gửi /video_tin <link bài báo>; có thể đính kèm ảnh làm thumb/minh họa. Hoặc /video_tin Tên bài | Tên nguồn | Nội dung tự cung cấp (ít nhất 300 ký tự). Tệp .txt: caption /video_tin Tên bài | Tên nguồn | Link (nếu có). /check_status xem tiến độ.');return;}
  let article,payload;try{({article,payload}=await newsInput(e,raw,message));}catch(err){await send(e,id,String(err.message)+'\nNếu trang chặn hoặc thiếu nội dung, gửi /video_tin Tên bài | Tên nguồn | Nội dung hoặc tệp .txt UTF-8.');return;}
  const url=article.url;
  const pending=await sql(e,"SELECT COUNT(*) n FROM video_jobs WHERE status IN ('queued','running','uploading')").first();
  if(pending.n>=10){await send(e,id,'Đã có 10 video đang chờ/xử lý. Vui lòng đợi rồi gửi tiếp.');return;}
  const duplicate=await sql(e,"SELECT id FROM video_jobs WHERE chat=? AND (json_extract(payload,'$.inputHash')=? OR (payload IS NULL AND url=?)) AND status IN ('queued','running','uploading')",id,payload.inputHash,url).first();
  if(duplicate){await send(e,id,'Bài này đang chờ/xử lý: '+duplicate.id);return;}
  const job='v'+updateId;
  await sql(e,"INSERT OR IGNORE INTO video_jobs(id,chat,title,url,excerpt,created,status,payload) VALUES(?,?,?,?,?,?,'queued',?)",job,id,article.title,url,article.summary,Date.now(),JSON.stringify(payload)).run();
  await send(e,id,'Đã xếp hàng '+job+': '+article.title+(payload.sources.some(s=>!s.read)?'\nLưu ý: '+payload.sources.filter(s=>!s.read).map(s=>s.id+' chưa đọc được').join('; ')+'. Chỉ dùng phần đọc được và tư liệu bạn gửi.':'')+'\nVideo sẽ gửi về cuộc trò chuyện này. Máy tắt/sleep thì yêu cầu chờ. /check_status xem tiến độ.');
  await prepareSocial(e,id,job,{...article,url,sources:payload.sources,sourceName:payload.sourceName,userProvided:!!payload.userText});
}
function videoFilename(title,time) {
  const base=norm(title).replace(/ /g,'-').slice(0,100)||'ban-tin';
  return base+'__'+iso(time+7*3600000).slice(0,19).replace('T','_').replace(/:/g,'-')+'.mp4';
}
async function videoAPI(request,e,ctx) {
  const bearer=request.headers.get('authorization')||'';
  if(!bearer.startsWith('Bearer ')||await sha(bearer.slice(7))!==(e.VIDEO_AGENT_SHA256||AGENT_SHA256))return json({error:'Forbidden'},403);
  await init(e);await initVideo(e);
  const route=new URL(request.url).pathname;
  if(request.method==='GET'&&route==='/render/ping')return json({ok:true,ownerPaired:!!await get(e,'owner'),agentSeen:Number(await get(e,'video_agent_seen')||0),version:'1.6.0-multi-source'});
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(route==='/render/article'){const a=await loadArticle((await request.json()).url);return json({title:a.title,url:a.url,characters:a.summary.length});}
  if(route==='/render/admin')return await adminSetup(e,await request.json());
  if(route==='/render/menu')return json(await syncMenu(e));
  if(route==='/render/audit')return json(await auditBot(e,(await request.json()).probeAI===true));
  if(route==='/render/claim') {
    if(request.headers.get('x-runtime-version')!=='multi-source-v3')return json({error:'Update required: start teleSetup multi-source-v3 on the PC'},426);
    await put(e,'video_agent_seen',Date.now());
    await sql(e,"UPDATE video_jobs SET status='uncertain',progress='Phiên gửi gián đoạn; kiểm tra Telegram trước khi gửi lại.' WHERE status='uploading' AND finished<?",Date.now()-10*60000).run();
    // A disconnected renderer keeps ownership; never automatically render twice.
    const current=await sql(e,"SELECT * FROM video_jobs WHERE status IN ('running','uploading') ORDER BY created LIMIT 1").first();
    if(current)return json({job:current,resume:true});
    const job=await sql(e,"UPDATE video_jobs SET status='running',started=? WHERE id=(SELECT id FROM video_jobs WHERE status='queued' ORDER BY created LIMIT 1) AND status='queued' RETURNING *",Date.now()).first();
    return json({job:job||null});
  }
  const jobId=request.headers.get('x-job-id')||'';
  const job=await sql(e,'SELECT * FROM video_jobs WHERE id=?',jobId).first();
  if(!job)return json({error:'Job not found'},404);
  if(route==='/render/media'){
    if(job.chat!==await get(e,'owner')&&!await get(e,'access:'+job.chat))return json({error:'Access revoked'},403);
    const data=await request.json(),media=JSON.parse(job.payload||'{}').media||[],item=media[data.index];
    if(!Number.isInteger(data.index)||!item)return json({error:'Image not found'},404);
    const bytes=await telegramFileBytes(e,item.fileId,6000000);return new Response(bytes,{headers:{'Content-Type':item.mime,'Cache-Control':'private, no-store'}});
  }
  if(route==='/render/status')return json({job});
  if(route==='/render/thumbnail'){
    if(job.status!=='running'||job.chat!==await get(e,'owner')&&!await get(e,'access:'+job.chat))return json({error:'Job unavailable'},409);
    const key='cover:'+job.id,previous=await get(e,key);if(previous){const saved=JSON.parse(previous);return json(saved,saved.fileId?200:409);}
    const size=Number(request.headers.get('content-length'));if(!Number.isInteger(size)||size<3||size>2000000)return json({error:'Invalid thumbnail size'},413);
    const bytes=new Uint8Array(await request.arrayBuffer());if(bytes.length!==size||bytes[0]!==255||bytes[1]!==216)return json({error:'JPEG required'},400);
    const locked=await sql(e,'INSERT OR IGNORE INTO state(k,v) VALUES(?,?)',key,JSON.stringify({status:'sending'})).run();if(!locked.meta.changes)return json({error:'Cover already processing'},409);
    try{const form=new FormData();form.set('chat_id',job.chat);form.set('caption',('Ảnh bìa: '+job.title).slice(0,1000));form.set('photo',new Blob([bytes],{type:'image/jpeg'}),'thumbnail.jpg');const response=await fetch('https://api.telegram.org/bot'+e.TELEGRAM_BOT_TOKEN+'/sendPhoto',{method:'POST',body:form,signal:AbortSignal.timeout(30000)});const result=await response.json();const fileId=result.result?.photo?.at(-1)?.file_id;if(!response.ok||!result.ok||!fileId)throw Error('Thumbnail rejected');const saved={ok:true,fileId};await put(e,key,JSON.stringify(saved));return json(saved);}catch{return json({error:'Cover upload uncertain; do not resend automatically'},502);}
  }
  if(route==='/render/progress') {
    const data=await request.json();
    await put(e,'video_agent_seen',Date.now());
    await sql(e,"UPDATE video_jobs SET progress=? WHERE id=? AND status='running'",String(data.progress||'').slice(0,200),jobId).run();
    return json({ok:true});
  }
  if(route==='/render/fail') {
    const data=await request.json();
    const result=await sql(e,"UPDATE video_jobs SET status='failed',progress=?,finished=? WHERE id=? AND status='running'",String(data.error||'Lỗi dựng video').slice(0,250),Date.now(),jobId).run();
    if(result.meta.changes)ctx.waitUntil(send(e,job.chat,'Video '+jobId+' chưa hoàn tất: '+String(data.error||'Lỗi dựng video').slice(0,250)).catch(()=>{}));
    return json({ok:true});
  }
  if(route==='/render/upload') {
    if(job.chat!==await get(e,'owner')&&!await get(e,'access:'+job.chat))return json({error:'Access revoked'},403);
    const length=Number(request.headers.get('content-length'));
    if(!Number.isInteger(length)||length<1||length>49000000||!request.body)return json({error:'Video must be 1–49,000,000 bytes'},413);
    const completed=Date.now(),filename=videoFilename(job.title,completed);
    const locked=await sql(e,"UPDATE video_jobs SET status='uploading',filename=?,finished=? WHERE id=? AND status='running'",filename,completed,jobId).run();
    if(!locked.meta.changes)return json({error:'Already uploaded or upload uncertain',status:job.status},409);
    const boundary='NewsAutoBear'+crypto.randomUUID().replaceAll('-',''),enc=new TextEncoder();
    const field=(name,value)=>'--'+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"\r\n\r\n'+value+'\r\n';
    const input=JSON.parse(job.payload||'{}'),sources=(input.sources||[]).filter(x=>x.read).map(x=>x.url);
    const caption=(job.title+'\nTạo lúc '+stamp(completed)+' (Việt Nam)\nNguồn: '+(sources.length?sources.join('\n'):input.sourceName||job.url)+'\nMã: '+jobId).slice(0,1024);
    const cover=JSON.parse(await get(e,'cover:'+job.id)||'null')||(JSON.parse(job.payload||'{}').media||[]).find(x=>x.photo&&x.role!=='illustration');
    const prefix=enc.encode(field('chat_id',job.chat)+field('caption',caption)+field('supports_streaming','true')+(cover?.fileId?field('cover',cover.fileId):'')+'--'+boundary+'\r\nContent-Disposition: form-data; name="video"; filename="'+filename+'"\r\nContent-Type: video/mp4\r\n\r\n');
    const suffix=enc.encode('\r\n--'+boundary+'--\r\n');
    const reader=request.body.getReader();let phase=0,total=0;
    const stream=new ReadableStream({async pull(controller){
      if(phase===0){phase=1;controller.enqueue(prefix);return;}
      const next=await reader.read();
      if(next.done){if(total!==length){controller.error(Error('Size mismatch'));return;}controller.enqueue(suffix);controller.close();return;}
      total+=next.value.byteLength;if(total>length){await reader.cancel();controller.error(Error('Size exceeded'));return;}controller.enqueue(next.value);
    },cancel(reason){return reader.cancel(reason);}});
    try {
      const r=await fetch('https://api.telegram.org/bot'+e.TELEGRAM_BOT_TOKEN+'/sendVideo',{method:'POST',headers:{'Content-Type':'multipart/form-data; boundary='+boundary},body:stream,signal:AbortSignal.timeout(180000)});
      const result=await r.json();
      if(!r.ok||!result.ok)throw Error('Telegram upload rejected');
      await sql(e,"UPDATE video_jobs SET status='done',message_id=?,progress='Đã gửi Telegram' WHERE id=?",result.result.message_id,jobId).run();
      return json({ok:true,filename,messageId:result.result.message_id,created:completed});
    }catch{
      await sql(e,"UPDATE video_jobs SET status='uncertain',progress='Không xác nhận được gửi; kiểm tra Telegram và bản MP4 trên máy trước khi gửi lại.' WHERE id=?",jobId).run();
      return json({error:'Upload uncertain; do not automatically resend'},502);
    }
  }
  return json({error:'Not found'},404);
}
