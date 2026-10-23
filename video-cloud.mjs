// Appended to worker.mjs by build-video.mjs. Uses its private DB/Telegram helpers.
const AGENT_SHA256 = '211db1a6d709600c11742511a7cdc93131c0dda05341a73ef5227844aad3dd25';
async function initVideo(e) {
  await e.DB.prepare(`CREATE TABLE IF NOT EXISTS video_jobs(
    id TEXT PRIMARY KEY, chat TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL,
    excerpt TEXT, created INTEGER NOT NULL, started INTEGER, finished INTEGER,
    status TEXT NOT NULL, progress TEXT, filename TEXT, message_id INTEGER)`).run();
}
async function videoCommand(e,id,text,updateId) {
  await initVideo(e);
  if(['/video_status','/check_status'].includes(text.split(/\s/)[0].split('@')[0])) {
    const rows=(await sql(e,'SELECT id,title,status,progress FROM video_jobs WHERE chat=? ORDER BY created DESC LIMIT 5',id).all()).results;
    const last=Number(await get(e,'video_agent_seen')||0);
    await send(e,id,'Máy dựng: '+(Date.now()-last<120000?'đang kết nối':'chưa kết nối hoặc đang tắt')+'\n'+(rows.map(r=>r.id+' · '+r.status+' · '+r.title+'\n'+(r.progress||'')).join('\n\n')||'Chưa có yêu cầu video.'));return;
  }
  const raw=text.replace(/^\/video(?:@\w+)?\s*/, '').trim();
  const url=safeURL(raw);
  if(!url) {await send(e,id,'Gửi /video <link bài báo> để dựng video. /check_status xem tiến độ.');return;}
  let article=await sql(e,'SELECT * FROM articles WHERE url=?',url).first();
  if(!article){try{article=await loadArticle(url);}catch(err){await send(e,id,String(err.message));return;}}
  const pending=await sql(e,"SELECT COUNT(*) n FROM video_jobs WHERE status IN ('queued','running','uploading')").first();
  if(pending.n>=10){await send(e,id,'Đã có 10 video đang chờ/xử lý. Vui lòng đợi rồi gửi tiếp.');return;}
  const duplicate=await sql(e,"SELECT id FROM video_jobs WHERE chat=? AND url=? AND status IN ('queued','running','uploading')",id,url).first();
  if(duplicate){await send(e,id,'Bài này đang chờ/xử lý: '+duplicate.id);return;}
  const job='v'+updateId;
  await sql(e,"INSERT OR IGNORE INTO video_jobs(id,chat,title,url,excerpt,created,status) VALUES(?,?,?,?,?,?,'queued')",job,id,article.title,url,article.summary,Date.now()).run();
  await send(e,id,'Đã xếp hàng '+job+': '+article.title+'\nVideo sẽ gửi về cuộc trò chuyện này. Máy tắt/sleep thì yêu cầu chờ. /check_status xem tiến độ.');
  await prepareSocial(e,id,job,{...article,url});
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
  if(request.method==='GET'&&route==='/render/ping')return json({ok:true,ownerPaired:!!await get(e,'owner'),agentSeen:Number(await get(e,'video_agent_seen')||0),version:'1.1.0'});
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(route==='/render/article'){const a=await loadArticle((await request.json()).url);return json({title:a.title,url:a.url,characters:a.summary.length});}
  if(route==='/render/admin')return await adminSetup(e,await request.json());
  if(route==='/render/menu')return json(await syncMenu(e));
  if(route==='/render/audit')return json(await auditBot(e,(await request.json()).probeAI===true));
  if(route==='/render/claim') {
    if(request.headers.get('x-runtime-version')!=='media-v3')return json({error:'Update required: start teleSetup media-v3 on the PC'},426);
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
  if(route==='/render/status')return json({job});
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
    const caption=(job.title+'\nTạo lúc '+stamp(completed)+' (Việt Nam)\nNguồn: '+job.url+'\nMã: '+jobId).slice(0,1024);
    const prefix=enc.encode(field('chat_id',job.chat)+field('caption',caption)+field('supports_streaming','true')+'--'+boundary+'\r\nContent-Disposition: form-data; name="video"; filename="'+filename+'"\r\nContent-Type: video/mp4\r\n\r\n');
    const suffix=enc.encode('\r\n--'+boundary+'--\r\n');
    const reader=request.body.getReader();let phase=0,total=0;
    const stream=new ReadableStream({async pull(controller){
      if(phase===0){phase=1;controller.enqueue(prefix);return;}
      const next=await reader.read();
      if(next.done){if(total!==length){controller.error(Error('Size mismatch'));return;}controller.enqueue(suffix);controller.close();return;}
      total+=next.value.byteLength;if(total>length){await reader.cancel();controller.error(Error('Size exceeded'));return;}controller.enqueue(next.value);
    },cancel(reason){return reader.cancel(reason);}});
    try {
      const r=await fetch('https://api.telegram.org/bot'+e.TELEGRAM_BOT_TOKEN+'/sendVideo',{method:'POST',headers:{'Content-Type':'multipart/form-data; boundary='+boundary},body:stream,duplex:'half',signal:AbortSignal.timeout(180000)});
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
